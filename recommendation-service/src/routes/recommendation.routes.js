const router = require("express").Router();
const c = require("../controllers/recommendation.controller");
const { authenticate } = require("../middlewares/auth.middleware");
router.post("/generate", authenticate, c.generate);
router.get("/me", authenticate, c.mine);
router.post("/:id/feedback", authenticate, c.feedback);
module.exports = router;
