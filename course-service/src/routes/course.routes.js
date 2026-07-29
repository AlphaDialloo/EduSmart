const router = require("express").Router();

const courseController = require("../controllers/course.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

// Liste des cours publiés
router.get("/", courseController.list);

// Détail public d’un cours publié
router.get("/:id", courseController.getOne);

router.use(authenticate);

router.get(
  "/management/my-courses",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.listMine,
);

router.get(
  "/management/:id",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.getOneForManagement,
);

router.post("/", authorize("INSTRUCTOR", "ADMIN"), courseController.create);

router.put("/:id", authorize("INSTRUCTOR", "ADMIN"), courseController.update);

router.post(
  "/:id/modules",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.addModule,
);

router.put(
  "/:courseId/modules/:moduleId",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.updateModule,
);

router.delete(
  "/:courseId/modules/:moduleId",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.deleteModule,
);

router.post(
  "/:courseId/modules/:moduleId/resources",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.addResource,
);

router.put(
  "/:courseId/modules/:moduleId/resources/:resourceId",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.updateResource,
);

router.delete(
  "/:courseId/modules/:moduleId/resources/:resourceId",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.deleteResource,
);

router.post(
  "/:courseId/quizzes",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.addQuiz,
);

router.get(
  "/:courseId/quizzes",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.listQuizzes,
);

router.get(
  "/:courseId/quizzes/:quizId",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.getQuiz,
);

router.put(
  "/:courseId/quizzes/:quizId",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.updateQuiz,
);

router.delete(
  "/:courseId/quizzes/:quizId",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.deleteQuiz,
);

router.post("/:courseId/quizzes/:quizId/submit", courseController.submitQuiz);

router.patch(
  "/:id/publish",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.publish,
);

router.patch(
  "/:id/unpublish",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.unpublish,
);

router.patch(
  "/:id/archive",
  authorize("INSTRUCTOR", "ADMIN"),
  courseController.archive,
);

module.exports = router;
