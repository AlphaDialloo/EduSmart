const router = require("express").Router();

const controller = require("../controllers/user.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

router.get(
  "/admin/summary",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  controller.adminSummary,
);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  controller.adminList,
);

router.patch(
  "/admin/:id",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  controller.adminUpdate,
);

module.exports = router;
