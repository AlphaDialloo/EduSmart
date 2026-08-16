const router = require("express").Router();
const controller = require("../controllers/recommendation.controller");
const {
  authenticate
} = require("../middlewares/auth.middleware");
router.use(authenticate);
router.post("/generate", controller.generate);
router.get("/me", controller.mine);
router.get("/dashboard", controller.dashboard);
router.post("/:id/feedback", controller.feedback);
module.exports = router;
