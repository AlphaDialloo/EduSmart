const router = require("express").Router();

const upload = require("../middlewares/upload.middleware");
const controller = require("../controllers/upload.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

router.post(
  "/image",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  upload.single("file"),
  controller.uploadImage,
);

router.post(
  "/video",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  upload.single("file"),
  controller.uploadVideo,
);

router.post(
  "/document",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  upload.single("file"),
  controller.uploadDocument,
);

module.exports = router;
