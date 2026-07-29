const axios = require("axios");
const pool = require("../config/db");

function authHeaders(req) {
  return {
    Authorization: req.headers.authorization,
  };
}

function sendError(res, error) {
  console.error(
    "Recommendation controller error:",
    error.response?.data || error.message,
  );

  if (error.response) {
    return res.status(error.response.status || 502).json({
      message:
        error.response.data?.message ||
        "Erreur lors de la communication avec un service.",
      serviceError:
        process.env.NODE_ENV === "development"
          ? error.response.data
          : undefined,
    });
  }

  if (error.code === "23503") {
    return res.status(409).json({
      message: "Une donnée liée est introuvable.",
    });
  }

  if (error.code === "23505") {
    return res.status(409).json({
      message: "Cette donnée existe déjà.",
    });
  }

  if (error.code === "22P02") {
    return res.status(400).json({
      message: "Un identifiant ou une valeur possède un format invalide.",
    });
  }

  return res.status(500).json({
    message: "Erreur serveur.",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}

/**
 * POST /api/recommendations/generate
 */
exports.generate = async (req, res) => {
  const client = await pool.connect();

  try {
    const requestedLimit = Number(req.body.limit);
    const limit =
      Number.isInteger(requestedLimit) &&
      requestedLimit >= 1 &&
      requestedLimit <= 20
        ? requestedLimit
        : 3;

    const [profileResponse, attemptsResponse, coursesResponse] =
      await Promise.all([
        axios.get(`${process.env.USER_SERVICE_URL}/users/profile`, {
          headers: authHeaders(req),
        }),

        axios.get(`${process.env.PROGRESS_SERVICE_URL}/progress/quizzes`, {
          headers: authHeaders(req),
        }),

        axios.get(`${process.env.COURSE_SERVICE_URL}/courses`, {
          headers: authHeaders(req),
        }),
      ]);

    const profile =
      profileResponse.data?.studentProfile ||
      profileResponse.data?.profile ||
      profileResponse.data ||
      {};

    const attempts = Array.isArray(attemptsResponse.data)
      ? attemptsResponse.data
      : attemptsResponse.data?.attempts || [];

    const courses = Array.isArray(coursesResponse.data)
      ? coursesResponse.data
      : coursesResponse.data?.courses || [];

    let level = profile.currentLevel || profile.current_level || "BEGINNER";

    let reason = "Recommandation basée sur le profil de l'étudiant.";

    const latestAttempt = attempts[0];

    if (latestAttempt) {
      const score = Number(latestAttempt.score);

      if (Number.isFinite(score) && score < 60) {
        level = "BEGINNER";
        reason =
          "Résultat faible au dernier quiz : contenu de renforcement recommandé.";
      } else if (Number.isFinite(score) && score >= 80) {
        level = "INTERMEDIATE";
        reason =
          "Bon résultat au dernier quiz : contenu plus avancé recommandé.";
      }
    }

    const selectedCourses = courses
      .filter((course) => {
        const courseLevel = String(course.level || "").toUpperCase();
        const courseStatus = String(course.status || "").toUpperCase();

        const validStatus =
          !courseStatus ||
          courseStatus === "PUBLISHED" ||
          courseStatus === "ACTIVE";

        return (
          courseLevel === String(level).toUpperCase() &&
          course.isActive !== false &&
          validStatus
        );
      })
      .slice(0, limit);

    await client.query("BEGIN");

    const recommendations = [];

    for (const course of selectedCourses) {
      const courseId = course._id || course.id;

      if (!courseId) {
        continue;
      }

      const query = await client.query(
        `
          INSERT INTO recommendation_service.recommendations (
            user_id,
            course_id,
            reason,
            recommendation_score
          )
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
        [req.user.id, String(courseId), reason, 85],
      );

      recommendations.push({
        ...query.rows[0],
        courseTitle: course.title,
        courseLevel: course.level,
        thumbnailAssetId: course.thumbnailAssetId || null,
      });
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Recommandations générées avec succès.",
      recommendations,
      total: recommendations.length,
      criteria: {
        level,
        reason,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendError(res, error);
  } finally {
    client.release();
  }
};

/**
 * GET /api/recommendations/me
 */
exports.mine = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT *
        FROM recommendation_service.recommendations
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [req.user.id],
    );

    return res.status(200).json({
      recommendations: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * POST /api/recommendations/:id/feedback
 */
exports.feedback = async (req, res) => {
  try {
    const { rating, comment = null } = req.body;
    const recommendationId = req.params.id;

    const normalizedRating = Number(rating);

    if (
      !Number.isInteger(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5
    ) {
      return res.status(400).json({
        message: "rating doit être un entier compris entre 1 et 5.",
      });
    }

    const recommendationResult = await pool.query(
      `
        SELECT id
        FROM recommendation_service.recommendations
        WHERE id = $1
          AND user_id = $2
      `,
      [recommendationId, req.user.id],
    );

    if (!recommendationResult.rowCount) {
      return res.status(404).json({
        message: "Recommandation introuvable.",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO recommendation_service.recommendation_feedback (
          recommendation_id,
          user_id,
          rating,
          comment
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [
        recommendationId,
        req.user.id,
        normalizedRating,
        comment ? String(comment).trim() : null,
      ],
    );

    return res.status(201).json({
      message: "Avis enregistré avec succès.",
      feedback: result.rows[0],
    });
  } catch (error) {
    return sendError(res, error);
  }
};
