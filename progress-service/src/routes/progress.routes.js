const router = require("express").Router();

const progressController = require("../controllers/progress.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.post("/enrollments", progressController.enroll);
router.get("/enrollments/me", progressController.mine);

router.post("/resources/progress", progressController.resourceProgress);

router.post("/quizzes", progressController.quiz);
router.get("/quizzes", progressController.quizList);
router.get(
  "/quizzes/:courseId/:quizId/summary",
  progressController.quizSummary,
);

module.exports = router;
