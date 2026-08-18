const axios = require("axios");
const pool = require("../config/db");
const {
  rankCourses
} = require("../services/recommendation.engine");
function authHeaders(req) {
  return {
    Authorization: req.headers.authorization
  };
}
async function optionalGet(url, req, fallback) {
  try {
    return await axios.get(url, {
      headers: authHeaders(req)
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        data: fallback
      };
    }
    throw error;
  }
}
function sendError(res, error) {
  console.error("Recommendation controller error:", error.response?.data || error.message);
  if (error.response) {
    return res.status(error.response.status || 502).json({
      message: error.response.data?.message || "Erreur lors de la communication avec un service.",
      serviceError: process.env.NODE_ENV === "development" ? error.response.data : undefined
    });
  }
  if (error.code === "23503") {
    return res.status(409).json({
      message: "Une donnée liée est introuvable."
    });
  }
  if (error.code === "23505") {
    return res.status(409).json({
      message: "Cette donnée existe déjà."
    });
  }
  if (error.code === "22P02") {
    return res.status(400).json({
      message: "Un identifiant ou une valeur possède un format invalide."
    });
  }
  return res.status(500).json({
    message: "Erreur serveur.",
    error: process.env.NODE_ENV === "development" ? error.message : undefined
  });
}
exports.generate = async (req, res) => {
  const client = await pool.connect();
  try {
    const requestedLimit = Number(req.body?.limit);
    const limit = Number.isInteger(requestedLimit) && requestedLimit >= 1 && requestedLimit <= 20 ? requestedLimit : 3;
    const [profileResponse, attemptsResponse, coursesResponse, enrollmentsResponse] = await Promise.all([optionalGet(`${process.env.USER_SERVICE_URL}/api/users/profile`, req, {
      studentProfile: null
    }), optionalGet(`${process.env.PROGRESS_SERVICE_URL}/progress/quizzes`, req, {
      attempts: []
    }), axios.get(`${process.env.COURSE_SERVICE_URL}/api/courses`, {
      headers: authHeaders(req)
    }), optionalGet(`${process.env.PROGRESS_SERVICE_URL}/progress/enrollments/me`, req, {
      enrollments: []
    })]);
    const profile = profileResponse.data?.studentProfile || profileResponse.data?.profile || profileResponse.data || {};
    const attempts = Array.isArray(attemptsResponse.data) ? attemptsResponse.data : attemptsResponse.data?.attempts || [];
    const courses = Array.isArray(coursesResponse.data) ? coursesResponse.data : coursesResponse.data?.courses || [];
    const rankedCourses = rankCourses({
      courses,
      profile,
      attempts,
      enrollments: enrollmentsResponse.data?.enrollments || [],
      limit
    });
    await client.query("BEGIN");
    await client.query(`DELETE FROM recommendation_service.recommendations r
       WHERE r.user_id = $1
         AND NOT EXISTS (
           SELECT 1
           FROM recommendation_service.recommendation_feedback f
           WHERE f.recommendation_id = r.id
         )`, [req.user.id]);
    const recommendations = [];
    for (const ranked of rankedCourses) {
      const {
        course,
        reason,
        score
      } = ranked;
      const courseId = course._id || course.id;
      if (!courseId) {
        continue;
      }
      const query = await client.query(`
          INSERT INTO recommendation_service.recommendations (
            user_id,
            course_id,
            reason,
            recommendation_score
          )
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [req.user.id, String(courseId), reason, score]);
      recommendations.push({
        ...query.rows[0],
        courseTitle: course.title,
        courseLevel: course.level,
        thumbnailAssetId: course.thumbnailAssetId || null
      });
    }
    await client.query("COMMIT");
    return res.status(201).json({
      message: "Recommandations générées avec succès.",
      recommendations,
      total: recommendations.length,
      criteria: {
        strategy: "hybrid-content-profile-performance",
        signals: ["niveau", "préférences", "objectifs", "quiz", "popularité", "cours déjà suivis"]
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendError(res, error);
  } finally {
    client.release();
  }
};
exports.mine = async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT *
        FROM recommendation_service.recommendations
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [req.user.id]);
    return res.status(200).json({
      recommendations: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.feedback = async (req, res) => {
  try {
    const {
      rating,
      comment = null
    } = req.body;
    const recommendationId = req.params.id;
    const normalizedRating = Number(rating);
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({
        message: "rating doit être un entier compris entre 1 et 5."
      });
    }
    const recommendationResult = await pool.query(`
        SELECT id
        FROM recommendation_service.recommendations
        WHERE id = $1
          AND user_id = $2
      `, [recommendationId, req.user.id]);
    if (!recommendationResult.rowCount) {
      return res.status(404).json({
        message: "Recommandation introuvable."
      });
    }
    const result = await pool.query(`
        INSERT INTO recommendation_service.recommendation_feedback (
          recommendation_id,
          user_id,
          rating,
          comment
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [recommendationId, req.user.id, normalizedRating, comment ? String(comment).trim() : null]);
    return res.status(201).json({
      message: "Avis enregistré avec succès.",
      feedback: result.rows[0]
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.dashboard = async (req, res) => {
  req.body = {
    ...(req.body || {}),
    limit: 6
  };
  return exports.generate(req, res);
};
