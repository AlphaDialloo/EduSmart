const router = require("express").Router();
const c = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
router.post("/register", c.register);
router.post("/login", c.login);
router.get("/me", authenticate, c.me);
module.exports = router;
