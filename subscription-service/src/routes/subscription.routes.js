const express = require("express");
const controller = require("../controllers/subscription.controller");
const {
  authenticate,
  authorize,
  authenticateInternal
} = require("../middlewares/auth.middleware");
const router = express.Router();
const instructorRoles = ["INSTRUCTOR", "FORMATEUR", "TEACHER"];
const adminRoles = ["ADMIN", "SUPER_ADMIN"];
router.post("/", authenticate, authorize(...instructorRoles), controller.createSubscription);
router.post("/renew", authenticate, authorize(...instructorRoles), controller.renewSubscription);
router.get("/me", authenticate, authorize(...instructorRoles), controller.getMe);
router.get("/me/status", authenticate, authorize(...instructorRoles), controller.getMyStatus);
router.post("/:id/cancel", authenticate, authorize(...instructorRoles), controller.cancelPending);
router.get("/internal/instructors/:instructorId/active", authenticateInternal, controller.checkInstructorActive);
router.get("/internal/:id", authenticateInternal, controller.getInternalById);
router.post("/internal/:id/activate", authenticateInternal, controller.activate);
router.post("/internal/:id/payment-failed", authenticateInternal, controller.paymentFailed);
router.post("/internal/expire-elapsed", authenticateInternal, controller.expireElapsed);
router.get("/admin", authenticate, authorize(...adminRoles), controller.listAdmin);
router.get("/admin/:id", authenticate, authorize(...adminRoles), controller.getAdminById);
router.patch("/admin/:id/status", authenticate, authorize(...adminRoles), controller.updateAdminStatus);
module.exports = router;
