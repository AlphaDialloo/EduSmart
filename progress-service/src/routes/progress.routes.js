const router = require("express").Router();

const controller = require("../controllers/progress.controller");

const {
  authenticate,
  authenticateInternal,
} = require("../middlewares/auth.middleware");

/*
|--------------------------------------------------------------------------
| Routes internes
|--------------------------------------------------------------------------
*/

router.post(
  "/internal/enrollments",
  authenticateInternal,
  controller.internalEnroll,
);

/*
|--------------------------------------------------------------------------
| Routes utilisateur
|--------------------------------------------------------------------------
*/

router.use(authenticate);

router.get(
  "/enrollments/:enrollmentId/progress",
  controller.getEnrollmentProgress,
);

// Inscriptions
router.post("/enrollments", controller.enroll);
router.get("/enrollments/me", controller.mine);

// Progression des ressources
router.post("/resources/progress", controller.resourceProgress);

// Temps d'apprentissage
router.post("/learning-time", controller.addLearningTime);

// Dashboard
router.get("/dashboard", controller.dashboard);

// Quiz
router.post("/quizzes", controller.quiz);
router.get("/quizzes", controller.quizList);

router.get("/quizzes/:courseId/:quizId/summary", controller.quizSummary);

module.exports = router;
