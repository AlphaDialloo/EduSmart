const router = require("express").Router();

const courseController = require("../controllers/course.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

const instructorOrAdmin = [authenticate, authorize("INSTRUCTOR", "ADMIN")];

const verifyInternal = require("../middlewares/internal.middleware");

// Liste des cours publiés
router.get("/", courseController.list);

// Liste des cours de l’instructeur connecté
router.get(
  "/management/my-courses",
  ...instructorOrAdmin,
  courseController.listMine,
);

router.get(
  "/student/enrollments",
  authenticate,
  authorize("STUDENT"),
  courseController.getStudentCourses,
);

router.get(
  "/student/enrollments/:courseId",
  authenticate,
  authorize("STUDENT"),
  courseController.getStudentCourseById,
);

router.get(
  "/management/instructor-dashboard",
  ...instructorOrAdmin,
  courseController.instructorDashboard,
);

// Détail complet d’un cours pour sa gestion
router.get(
  "/management/:id",
  ...instructorOrAdmin,
  courseController.getOneForManagement,
);

// Création d’un cours
router.post("/", ...instructorOrAdmin, courseController.create);

// Modification d’un cours
router.put("/:id", ...instructorOrAdmin, courseController.update);

router.post("/:id/modules", ...instructorOrAdmin, courseController.addModule);

router.put(
  "/:courseId/modules/:moduleId",
  ...instructorOrAdmin,
  courseController.updateModule,
);

router.delete(
  "/:courseId/modules/:moduleId",
  ...instructorOrAdmin,
  courseController.deleteModule,
);

router.post(
  "/:courseId/modules/:moduleId/resources",
  ...instructorOrAdmin,
  courseController.addResource,
);

router.put(
  "/:courseId/modules/:moduleId/resources/:resourceId",
  ...instructorOrAdmin,
  courseController.updateResource,
);

router.delete(
  "/:courseId/modules/:moduleId/resources/:resourceId",
  ...instructorOrAdmin,
  courseController.deleteResource,
);

router.post(
  "/:courseId/quizzes",
  ...instructorOrAdmin,
  courseController.addQuiz,
);

router.get(
  "/:courseId/quizzes",
  ...instructorOrAdmin,
  courseController.listQuizzes,
);

router.get(
  "/:courseId/quizzes/:quizId",
  ...instructorOrAdmin,
  courseController.getQuiz,
);

router.put(
  "/:courseId/quizzes/:quizId",
  ...instructorOrAdmin,
  courseController.updateQuiz,
);

router.delete(
  "/:courseId/quizzes/:quizId",
  ...instructorOrAdmin,
  courseController.deleteQuiz,
);

// Soumission d’un quiz par un utilisateur connecté
router.post(
  "/:courseId/quizzes/:quizId/submit",
  authenticate,
  courseController.submitQuiz,
);

/*
|--------------------------------------------------------------------------
| Publication et archivage
|--------------------------------------------------------------------------
*/

router.patch("/:id/publish", ...instructorOrAdmin, courseController.publish);

router.patch(
  "/:id/unpublish",
  ...instructorOrAdmin,
  courseController.unpublish,
);

router.patch("/:id/archive", ...instructorOrAdmin, courseController.archive);

/*
|--------------------------------------------------------------------------
| Détail public
|--------------------------------------------------------------------------
|
| Cette route dynamique doit rester après les routes fixes comme
| /management/my-courses.
|
*/

router.get(
  "/internal/:courseId/payment-details",
  verifyInternal,
  courseController.getPaymentDetails,
);

router.post(
  "/internal/:courseId/grant-access",
  verifyInternal,
  courseController.grantAccess,
);
router.get(
  "/admin/summary",
  authenticate,
  authorize("ADMIN"),
  courseController.adminSummary,
);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN"),
  courseController.adminList,
);

router.patch(
  "/admin/:id/status",
  authenticate,
  authorize("ADMIN"),
  courseController.adminUpdateStatus,
);

router.get("/:id", courseController.getOne);

module.exports = router;
