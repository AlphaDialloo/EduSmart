const router = require("express").Router();
const controller = require("../controllers/interaction.controller");
const { authenticate } = require("../middlewares/auth.middleware");

// Créer une publication
router.post("/posts", authenticate, controller.createPost);

// Liste des publications d'un cours (pagination)
router.get("/courses/:courseId/posts", controller.getCoursePosts);

// Détail d'une publication
router.get("/posts/:postId", controller.getPostById);

// Modifier une publication
router.put("/posts/:postId", authenticate, controller.updatePost);

// Supprimer une publication
router.delete("/posts/:postId", authenticate, controller.deletePost);

// Like / Dislike d'une publication
router.patch("/posts/:postId/reaction", authenticate, controller.reactToPost);

// Ajouter un commentaire ou une réponse
router.post("/posts/:postId/comments", authenticate, controller.createComment);

// Liste des commentaires d'une publication
router.get("/posts/:postId/comments", controller.getPostComments);

// Liste des réponses d'un commentaire
router.get("/comments/:commentId/replies", controller.getCommentReplies);

// Modifier un commentaire
router.put("/comments/:commentId", authenticate, controller.updateComment);

// Supprimer un commentaire
router.delete("/comments/:commentId", authenticate, controller.deleteComment);

// Like / Dislike d'un commentaire
router.patch(
  "/comments/:commentId/reaction",
  authenticate,
  controller.reactToComment,
);

module.exports = router;
