const router = require("express").Router();
const controller = require("../controllers/settings.controller");
const {
  authenticate,
  authorize,
} = require("../middlewares/auth.middleware");

router.get("/public", controller.getPublicSettings);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  controller.getAdminSettings,
);

router.put(
  "/admin",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  controller.updateSettings,
);

router.get("/features", controller.listFeatureFlags);

router.get("/features/:key", controller.getFeatureFlag);

router.post(
  "/features",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  controller.createFeatureFlag,
);

router.patch(
  "/features/:key",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  controller.updateFeatureFlag,
);

router.delete(
  "/features/:key",
  authenticate,
  authorize("SUPER_ADMIN"),
  controller.deleteFeatureFlag,
);

module.exports = router;
