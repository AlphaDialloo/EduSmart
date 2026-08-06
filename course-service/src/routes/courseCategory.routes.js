const router = require("express").Router();

const controller = require("../controllers/courseCategory.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const adminOnly = [authenticate, authorize("ADMIN", "SUPER_ADMIN")];

router.get("/", controller.listPublic);
router.get("/management", ...adminOnly, controller.listAll);
router.get("/:id", controller.getOne);
router.post("/", ...adminOnly, controller.create);
router.put("/:id", ...adminOnly, controller.update);
router.patch("/:id/status", ...adminOnly, controller.setStatus);
router.delete("/:id", ...adminOnly, controller.remove);

module.exports = router;
