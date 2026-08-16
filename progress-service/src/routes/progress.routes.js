const router = require("express").Router();
const controller = require("../controllers/progress.controller");
const {
  authenticate,
  authenticateInternal
} = require("../middlewares/auth.middleware");
router.post("/internal/enrollments", authenticateInternal, controller.internalEnroll);
router.use(authenticate);
router.get("/enrollments/:enrollmentId/progress", controller.getEnrollmentProgress);
router.get("/enrollments/:enrollmentId/reflections", controller.listReflections);
router.put("/enrollments/:enrollmentId/reflections/:moduleId", controller.saveReflection);
router.post("/enrollments", controller.enroll);
router.get("/enrollments/me", controller.mine);
router.post("/resources/progress", controller.resourceProgress);
router.post("/learning-time", controller.addLearningTime);
router.get("/dashboard", controller.dashboard);
router.post("/quizzes", controller.quiz);
router.get("/quizzes", controller.quizList);
router.get("/quizzes/:courseId/:quizId/summary", controller.quizSummary);
module.exports = router;
