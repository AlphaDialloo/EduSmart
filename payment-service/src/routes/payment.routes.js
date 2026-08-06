const router = require("express").Router();
const c = require("../controllers/payment.controller");
const {
  authenticate,
  authorize,
  authenticateInternal,
} = require("../middlewares/auth.middleware");
router.post("/", authenticate, c.create);
router.get("/me", authenticate, c.getMine);
router.get(
  "/admin/summary",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  c.adminSummary,
);
router.get(
  "/admin",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  c.adminList,
);
router.get(
  "/instructor/analytics",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN", "SUPER_ADMIN"),
  c.instructorAnalytics,
);
router.get(
  "/admin/:id",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  c.adminGetOne,
);
router.post(
  "/admin/:id/refund",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  c.refund,
);

router.post("/internal/:id/test-success", authenticateInternal, c.testSuccess);
router.post("/internal/:id/test-failure", authenticateInternal, c.testFailure);

router.post("/:id/test-success", authenticate, c.testSuccess);

router.post("/:id/test-failure", authenticate, c.testFailure);
// payment.routes.js

router.post("/:id/cancel", authenticate, c.cancel);
router.get("/:id", authenticate, c.getOne);
module.exports = router;
