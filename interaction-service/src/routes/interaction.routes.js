const router = require("express").Router();
const controller = require("../controllers/interaction.controller");
const {
  authenticate
} = require("../middlewares/auth.middleware");
router.post("/posts", authenticate, controller.createPost);
router.get("/courses/:courseId/posts", controller.getCoursePosts);
router.get("/posts/:postId", controller.getPostById);
router.put("/posts/:postId", authenticate, controller.updatePost);
router.delete("/posts/:postId", authenticate, controller.deletePost);
router.patch("/posts/:postId/reaction", authenticate, controller.reactToPost);
router.post("/posts/:postId/comments", authenticate, controller.createComment);
router.get("/posts/:postId/comments", controller.getPostComments);
router.get("/comments/:commentId/replies", controller.getCommentReplies);
router.put("/comments/:commentId", authenticate, controller.updateComment);
router.delete("/comments/:commentId", authenticate, controller.deleteComment);
router.patch("/comments/:commentId/reaction", authenticate, controller.reactToComment);
module.exports = router;
