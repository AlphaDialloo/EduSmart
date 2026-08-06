const pool = require("../config/db");

function sendError(res, error) {
  console.error("Progress controller error:", error);

  if (error?.code === "22P02") {
    return res.status(400).json({
      message: "Une valeur fournie possède un format invalide.",
    });
  }

  if (error?.code === "23503") {
    return res.status(409).json({
      message: "Une donnée liée est introuvable.",
    });
  }

  if (error?.code === "23505") {
    return res.status(409).json({
      message: "Cette donnée existe déjà.",
    });
  }

  return res.status(500).json({
    message: "Erreur serveur.",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}

function normalizePercentage(value, defaultValue = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return defaultValue;
  }

  return Math.min(Math.max(number, 0), 100);
}

function normalizePositiveInteger(value, defaultValue = 1) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return defaultValue;
  }

  return number;
}

function requireUser(req, res) {
  if (!req.user?.id) {
    res.status(401).json({
      message: "Utilisateur non authentifié.",
    });

    return false;
  }

  return true;
}

/**
 * POST /api/progress/enrollments
 *
 * Inscrit l'utilisateur à un cours ou réactive une inscription existante.
 */
exports.enroll = async (req, res) => {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const { courseId, courseTitle } = req.body;

    if (!courseId || !String(courseId).trim()) {
      return res.status(400).json({
        message: "L'identifiant du cours est obligatoire.",
      });
    }

    if (!courseTitle || !String(courseTitle).trim()) {
      return res.status(400).json({
        message: "Le titre du cours est obligatoire.",
      });
    }

    const query = `
      INSERT INTO progress_service.enrollments (
        user_id,
        course_id,
        course_title,
        status,
        progress_percentage,
        started_at,
        updated_at
      )
      VALUES ($1, $2, $3, 'IN_PROGRESS', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, course_id)
      DO UPDATE SET
        course_title = EXCLUDED.course_title,
        status = CASE
          WHEN progress_service.enrollments.status = 'COMPLETED'
            THEN progress_service.enrollments.status
          ELSE 'IN_PROGRESS'
        END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [
      req.user.id,
      String(courseId).trim(),
      String(courseTitle).trim(),
    ]);

    return res.status(201).json({
      message: "Inscription au cours enregistrée.",
      enrollment: result.rows[0],
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getEnrollmentProgress = async (req, res) => {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const enrollmentId = req.params.enrollmentId;

    const enrollmentResult = await pool.query(
      `
        SELECT *
        FROM progress_service.enrollments
        WHERE id = $1
          AND user_id = $2
      `,
      [enrollmentId, req.user.id],
    );

    if (!enrollmentResult.rowCount) {
      return res.status(404).json({
        message: "Inscription introuvable.",
      });
    }

    const resourcesResult = await pool.query(
      `
        SELECT
          id,
          enrollment_id,
          module_id,
          resource_id,
          progress_percentage,
          completed,
          completed_at,
          last_accessed_at
        FROM progress_service.resource_progress
        WHERE enrollment_id = $1
        ORDER BY last_accessed_at DESC
      `,
      [enrollmentId],
    );

    return res.status(200).json({
      enrollment: enrollmentResult.rows[0],
      resources: resourcesResult.rows,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * GET /api/progress/enrollments/me
 *
 * Retourne les inscriptions de l'utilisateur connecté.
 */
exports.mine = async (req, res) => {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const result = await pool.query(
      `
        SELECT *
        FROM progress_service.enrollments
        WHERE user_id = $1
        ORDER BY updated_at DESC, started_at DESC
      `,
      [req.user.id],
    );

    return res.status(200).json({
      enrollments: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * POST /api/progress/resources/progress
 *
 * Crée ou met à jour la progression d'une ressource.
 */
exports.resourceProgress = async (req, res) => {
  const client = await pool.connect();

  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      enrollmentId,
      moduleId,
      resourceId,
      totalResources,
      progressPercentage = 0,
      completed = false,
    } = req.body;

    if (!enrollmentId || !moduleId || !resourceId) {
      return res.status(400).json({
        message: "enrollmentId, moduleId et resourceId sont obligatoires.",
      });
    }

    const normalizedTotalResources = Number(totalResources);

    if (
      !Number.isInteger(normalizedTotalResources) ||
      normalizedTotalResources < 1
    ) {
      return res.status(400).json({
        message: "totalResources doit être un entier supérieur ou égal à 1.",
      });
    }

    const normalizedProgress = completed
      ? 100
      : normalizePercentage(progressPercentage);

    await client.query("BEGIN");

    const enrollmentResult = await client.query(
      `
        SELECT id
        FROM progress_service.enrollments
        WHERE id = $1
          AND user_id = $2
        FOR UPDATE
      `,
      [enrollmentId, req.user.id],
    );

    if (!enrollmentResult.rowCount) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Inscription introuvable.",
      });
    }

    const resourceResult = await client.query(
      `
        INSERT INTO progress_service.resource_progress (
          enrollment_id,
          module_id,
          resource_id,
          progress_percentage,
          completed,
          completed_at,
          last_accessed_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          CASE WHEN $5 = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (enrollment_id, module_id, resource_id)
        DO UPDATE SET
          progress_percentage = EXCLUDED.progress_percentage,
          completed = EXCLUDED.completed,
          completed_at = CASE
            WHEN EXCLUDED.completed = TRUE
              THEN COALESCE(
                progress_service.resource_progress.completed_at,
                CURRENT_TIMESTAMP
              )
            ELSE NULL
          END,
          last_accessed_at = CURRENT_TIMESTAMP
        RETURNING *
      `,
      [
        enrollmentId,
        String(moduleId),
        String(resourceId),
        normalizedProgress,
        Boolean(completed),
      ],
    );

    /*
     * Calcule la progression sur le nombre TOTAL de ressources du cours.
     * Les ressources qui ne possèdent encore aucune ligne dans resource_progress
     * sont ainsi considérées comme étant à 0 %.
     *
     * Exemple : 2 ressources au total, une terminée à 100 % et une non commencée
     * donnent (100 + 0) / 2 = 50 %.
     */
    const progressResult = await client.query(
      `
        SELECT
          LEAST(
            100::numeric,
            COALESCE(
              ROUND(
                SUM(progress_percentage)::numeric / $2::numeric,
                2
              ),
              0::numeric
            )
          ) AS progress,
          COUNT(*)::integer AS started_resources,
          COUNT(*) FILTER (WHERE completed = TRUE)::integer
            AS completed_resources
        FROM progress_service.resource_progress
        WHERE enrollment_id = $1
      `,
      [enrollmentId, normalizedTotalResources],
    );

    const overallProgress = Number(progressResult.rows[0].progress || 0);

    const updatedEnrollmentResult = await client.query(
      `
    UPDATE progress_service.enrollments
    SET
      progress_percentage = $2::NUMERIC,
      status = CASE
        WHEN $2::NUMERIC >= 100::NUMERIC THEN 'COMPLETED'
        WHEN $2::NUMERIC > 0::NUMERIC THEN 'IN_PROGRESS'
        ELSE status
      END,
      completed_at = CASE
        WHEN $2::NUMERIC >= 100::NUMERIC
          THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
        ELSE NULL
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `,
      [enrollmentId, overallProgress],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Progression de la ressource enregistrée.",
      resourceProgress: resourceResult.rows[0],
      enrollment: updatedEnrollmentResult.rows[0],
      progressSummary: {
        totalResources: normalizedTotalResources,
        startedResources: Number(progressResult.rows[0].started_resources || 0),
        completedResources: Number(
          progressResult.rows[0].completed_resources || 0,
        ),
        overallProgress,
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
 * POST /api/progress/quizzes
 *
 * Enregistre une tentative corrigée par le course-service.
 *
 * Cette route doit idéalement être appelée par le course-service
 * via une authentification interservices, car elle reçoit déjà le résultat
 * calculé du quiz.
 */
exports.quiz = async (req, res) => {
  const client = await pool.connect();

  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      enrollmentId = null,
      courseId,
      quizId,
      moduleId = null,
      score,
      passingScore,
      passed,
      earnedPoints = 0,
      totalPoints = 0,
      correctAnswers = 0,
      incorrectAnswers = 0,
      totalQuestions = 0,
      details = [],
      maxAttempts = 1,
      submittedAt = null,
    } = req.body;

    if (!courseId || !quizId) {
      return res.status(400).json({
        message: "courseId et quizId sont obligatoires.",
      });
    }

    const normalizedScore = normalizePercentage(score);
    const normalizedPassingScore = normalizePercentage(passingScore, 70);
    const normalizedMaxAttempts = normalizePositiveInteger(maxAttempts, 1);

    if (typeof passed !== "boolean") {
      return res.status(400).json({
        message: "Le champ passed doit être un booléen.",
      });
    }

    if (!Array.isArray(details)) {
      return res.status(400).json({
        message: "Le champ details doit être un tableau.",
      });
    }

    await client.query("BEGIN");

    if (enrollmentId) {
      const enrollmentResult = await client.query(
        `
          SELECT id
          FROM progress_service.enrollments
          WHERE id = $1
            AND user_id = $2
            AND course_id = $3
          FOR UPDATE
        `,
        [enrollmentId, req.user.id, String(courseId)],
      );

      if (!enrollmentResult.rowCount) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Inscription au cours introuvable.",
        });
      }
    }

    const attemptsResult = await client.query(
      `
        SELECT
          COUNT(*)::integer AS attempt_count,
          COALESCE(MAX(score), 0) AS best_score
        FROM progress_service.quiz_attempts
        WHERE user_id = $1
          AND course_id = $2
          AND quiz_id = $3
      `,
      [req.user.id, String(courseId), String(quizId)],
    );

    const currentAttemptCount =
      Number(attemptsResult.rows[0].attempt_count) || 0;

    if (currentAttemptCount >= normalizedMaxAttempts) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Le nombre maximal de tentatives a été atteint.",
        attemptCount: currentAttemptCount,
        maxAttempts: normalizedMaxAttempts,
        remainingAttempts: 0,
      });
    }

    const attemptNumber = currentAttemptCount + 1;

    const insertResult = await client.query(
      `
        INSERT INTO progress_service.quiz_attempts (
          user_id,
          enrollment_id,
          course_id,
          module_id,
          quiz_id,
          score,
          passing_score,
          passed,
          earned_points,
          total_points,
          correct_answers,
          incorrect_answers,
          total_questions,
          details,
          attempt_number,
          submitted_at,
          created_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14::jsonb, $15,
          COALESCE($16::timestamptz, CURRENT_TIMESTAMP),
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `,
      [
        req.user.id,
        enrollmentId,
        String(courseId),
        moduleId ? String(moduleId) : null,
        String(quizId),
        normalizedScore,
        normalizedPassingScore,
        passed,
        Number(earnedPoints) || 0,
        Number(totalPoints) || 0,
        Number(correctAnswers) || 0,
        Number(incorrectAnswers) || 0,
        Number(totalQuestions) || 0,
        JSON.stringify(details),
        attemptNumber,
        submittedAt,
      ],
    );

    const summaryResult = await client.query(
      `
        SELECT
          COUNT(*)::integer AS attempt_count,
          COALESCE(MAX(score), 0) AS best_score,
          BOOL_OR(passed) AS has_passed
        FROM progress_service.quiz_attempts
        WHERE user_id = $1
          AND course_id = $2
          AND quiz_id = $3
      `,
      [req.user.id, String(courseId), String(quizId)],
    );

    await client.query("COMMIT");

    const attemptCount =
      Number(summaryResult.rows[0].attempt_count) || attemptNumber;
    const bestScore =
      Number(summaryResult.rows[0].best_score) || normalizedScore;

    return res.status(201).json({
      message: "Tentative de quiz enregistrée.",
      attempt: insertResult.rows[0],
      summary: {
        attemptCount,
        maxAttempts: normalizedMaxAttempts,
        remainingAttempts: Math.max(normalizedMaxAttempts - attemptCount, 0),
        bestScore,
        hasPassed: Boolean(summaryResult.rows[0].has_passed),
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
 * GET /api/progress/quizzes
 *
 * Liste toutes les tentatives de l'utilisateur connecté.
 * Filtres optionnels : courseId, quizId.
 */
exports.quizList = async (req, res) => {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const { courseId, quizId } = req.query;
    const values = [req.user.id];
    const conditions = ["user_id = $1"];

    if (courseId) {
      values.push(String(courseId));
      conditions.push(`course_id = $${values.length}`);
    }

    if (quizId) {
      values.push(String(quizId));
      conditions.push(`quiz_id = $${values.length}`);
    }

    const result = await pool.query(
      `
        SELECT *
        FROM progress_service.quiz_attempts
        WHERE ${conditions.join(" AND ")}
        ORDER BY submitted_at DESC, created_at DESC
      `,
      values,
    );

    return res.status(200).json({
      attempts: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * GET /api/progress/quizzes/:courseId/:quizId/summary
 *
 * Retourne le résumé des tentatives pour un quiz.
 */
exports.quizSummary = async (req, res) => {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const { courseId, quizId } = req.params;

    const result = await pool.query(
      `
        SELECT
          COUNT(*)::integer AS attempt_count,
          COALESCE(MAX(score), 0) AS best_score,
          COALESCE(ROUND(AVG(score)::numeric, 2), 0) AS average_score,
          BOOL_OR(passed) AS has_passed,
          MAX(submitted_at) AS last_submitted_at
        FROM progress_service.quiz_attempts
        WHERE user_id = $1
          AND course_id = $2
          AND quiz_id = $3
      `,
      [req.user.id, String(courseId), String(quizId)],
    );

    return res.status(200).json({
      summary: {
        attemptCount: Number(result.rows[0].attempt_count) || 0,
        bestScore: Number(result.rows[0].best_score) || 0,
        averageScore: Number(result.rows[0].average_score) || 0,
        hasPassed: Boolean(result.rows[0].has_passed),
        lastSubmittedAt: result.rows[0].last_submitted_at,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * POST /api/progress/learning-time
 *
 * Enregistre une tranche courte de temps réellement passée par l'utilisateur
 * sur une ressource. Le frontend devrait envoyer une tranche toutes les 30 à
 * 60 secondes uniquement lorsque l'onglet est visible et actif.
 */
exports.addLearningTime = async (req, res) => {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      enrollmentId,
      courseId,
      moduleId = null,
      resourceId = null,
      durationSeconds,
    } = req.body;

    if (!enrollmentId || !courseId) {
      return res.status(400).json({
        message: "enrollmentId et courseId sont obligatoires.",
      });
    }

    const normalizedDuration = Number(durationSeconds);

    if (
      !Number.isInteger(normalizedDuration) ||
      normalizedDuration < 1 ||
      normalizedDuration > 300
    ) {
      return res.status(400).json({
        message: "durationSeconds doit être un entier compris entre 1 et 300.",
      });
    }

    const enrollmentResult = await pool.query(
      `
        SELECT id
        FROM progress_service.enrollments
        WHERE id = $1
          AND user_id = $2
          AND course_id = $3
      `,
      [enrollmentId, req.user.id, String(courseId)],
    );

    if (!enrollmentResult.rowCount) {
      return res.status(404).json({
        message: "Inscription au cours introuvable.",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO progress_service.learning_sessions (
          user_id,
          enrollment_id,
          course_id,
          module_id,
          resource_id,
          duration_seconds,
          session_date,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          CURRENT_DATE,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `,
      [
        req.user.id,
        enrollmentId,
        String(courseId),
        moduleId ? String(moduleId) : null,
        resourceId ? String(resourceId) : null,
        normalizedDuration,
      ],
    );

    return res.status(201).json({
      message: "Temps d’apprentissage enregistré.",
      learningSession: result.rows[0],
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * GET /api/progress/dashboard
 *
 * Retourne les statistiques principales de l'étudiant connecté ainsi que ses
 * inscriptions les plus récentes.
 */
exports.dashboard = async (req, res) => {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const enrollmentStatsResult = await pool.query(
      `
        SELECT
          COUNT(*) FILTER (
            WHERE status = 'IN_PROGRESS'
          )::integer AS active_courses,

          COUNT(*) FILTER (
            WHERE status = 'COMPLETED'
          )::integer AS completed_courses,

          COALESCE(
            ROUND(AVG(progress_percentage)::numeric, 2),
            0
          ) AS average_progress
        FROM progress_service.enrollments
        WHERE user_id = $1
      `,
      [req.user.id],
    );

    const learningTimeResult = await pool.query(
      `
        SELECT
          COALESCE(SUM(duration_seconds), 0)::bigint
            AS total_learning_seconds,

          COALESCE(
            SUM(duration_seconds) FILTER (
              WHERE session_date >= CURRENT_DATE - INTERVAL '6 days'
            ),
            0
          )::bigint AS weekly_learning_seconds
        FROM progress_service.learning_sessions
        WHERE user_id = $1
      `,
      [req.user.id],
    );

    const recentEnrollmentsResult = await pool.query(
      `
        SELECT
          id,
          course_id,
          course_title,
          status,
          progress_percentage,
          started_at,
          completed_at,
          updated_at
        FROM progress_service.enrollments
        WHERE user_id = $1
        ORDER BY updated_at DESC, started_at DESC
        LIMIT 5
      `,
      [req.user.id],
    );

    const enrollmentStats = enrollmentStatsResult.rows[0] || {};
    const learningTime = learningTimeResult.rows[0] || {};

    return res.status(200).json({
      stats: {
        activeCourses: Number(enrollmentStats.active_courses) || 0,
        completedCourses: Number(enrollmentStats.completed_courses) || 0,
        averageProgress: Number(enrollmentStats.average_progress) || 0,
        totalLearningSeconds: Number(learningTime.total_learning_seconds) || 0,
        weeklyLearningSeconds:
          Number(learningTime.weekly_learning_seconds) || 0,
      },
      recentEnrollments: recentEnrollmentsResult.rows,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * POST /api/progress/internal/enrollments
 *
 * Crée ou met à jour une inscription depuis un autre microservice,
 * par exemple après un paiement réussi.
 */
exports.internalEnroll = async (req, res) => {
  try {
    const { studentId, courseId, courseTitle } = req.body;

    if (!studentId || !courseId || !courseTitle) {
      return res.status(400).json({
        message: "studentId, courseId et courseTitle sont obligatoires.",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO progress_service.enrollments (
          user_id,
          course_id,
          course_title,
          status,
          progress_percentage,
          started_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'IN_PROGRESS',
          0,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id, course_id)
        DO UPDATE SET
          course_title = EXCLUDED.course_title,
          status = CASE
            WHEN progress_service.enrollments.status = 'COMPLETED'
              THEN progress_service.enrollments.status
            ELSE 'IN_PROGRESS'
          END,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `,
      [
        String(studentId).trim(),
        String(courseId).trim(),
        String(courseTitle).trim(),
      ],
    );

    return res.status(201).json({
      message: "Inscription interne enregistrée.",
      enrollment: result.rows[0],
    });
  } catch (error) {
    return sendError(res, error);
  }
};
