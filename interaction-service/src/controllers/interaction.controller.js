const mongoose = require("mongoose");
const ForumPost = require("../models/ForumPost");
const Comment = require("../models/Comment");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function sendError(res, error) {
  console.error("Interaction controller error:", error);

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: "Données invalides.",
      errors: Object.values(error.errors).map((item) => item.message),
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: "Identifiant invalide.",
    });
  }

  return res.status(500).json({
    message: "Erreur serveur.",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}

function getPagination(query) {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : DEFAULT_PAGE;

  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function getCurrentUserId(req) {
  return String(req.user?.id || "").trim();
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function updateReaction({ model, documentId, userId, reaction }) {
  const document = await model.findById(documentId);

  if (!document) {
    return null;
  }

  const alreadyLiked = document.likes.includes(userId);
  const alreadyDisliked = document.dislikes.includes(userId);

  document.likes = document.likes.filter((id) => id !== userId);
  document.dislikes = document.dislikes.filter((id) => id !== userId);

  if (reaction === "like" && !alreadyLiked) {
    document.likes.push(userId);
  }

  if (reaction === "dislike" && !alreadyDisliked) {
    document.dislikes.push(userId);
  }

  await document.save();
  return document;
}

/**
 * POST /api/interactions/posts
 */
exports.createPost = async (req, res) => {
  try {
    const { courseId, title, content } = req.body;
    const authorId = getCurrentUserId(req);

    if (!authorId) {
      return res.status(401).json({
        message: "Utilisateur non authentifié.",
      });
    }

    if (!courseId || !String(courseId).trim()) {
      return res.status(400).json({
        message: "courseId est obligatoire.",
      });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        message: "Le titre de la publication est obligatoire.",
      });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        message: "Le contenu de la publication est obligatoire.",
      });
    }

    const post = await ForumPost.create({
      courseId: String(courseId).trim(),
      authorId,
      title: String(title).trim(),
      content: String(content).trim(),
    });

    return res.status(201).json({
      message: "Publication créée avec succès.",
      post,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Compatibilité avec l'ancien nom utilisé dans les routes.
 */
exports.post = exports.createPost;

/**
 * GET /api/interactions/courses/:courseId/posts?page=1&limit=20
 */
exports.getCoursePosts = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page, limit, skip } = getPagination(req.query);

    if (!courseId || !String(courseId).trim()) {
      return res.status(400).json({
        message: "courseId est obligatoire.",
      });
    }

    const filter = {
      courseId: String(courseId).trim(),
    };

    const [posts, total] = await Promise.all([
      ForumPost.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ForumPost.countDocuments(filter),
    ]);

    return res.status(200).json({
      posts: posts.map((post) => ({
        ...post,
        likeCount: post.likes?.length ?? 0,
        dislikeCount: post.dislikes?.length ?? 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.posts = exports.getCoursePosts;

/**
 * GET /api/interactions/posts/:postId
 */
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Identifiant de publication invalide.",
      });
    }

    const post = await ForumPost.findById(postId).lean();

    if (!post) {
      return res.status(404).json({
        message: "Publication introuvable.",
      });
    }

    return res.status(200).json({
      post: {
        ...post,
        likeCount: post.likes?.length ?? 0,
        dislikeCount: post.dislikes?.length ?? 0,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * PUT /api/interactions/posts/:postId
 */
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;
    const userId = getCurrentUserId(req);

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Identifiant de publication invalide.",
      });
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Publication introuvable.",
      });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({
        message: "Tu ne peux modifier que tes propres publications.",
      });
    }

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          message: "Le titre ne peut pas être vide.",
        });
      }
      post.title = String(title).trim();
    }

    if (content !== undefined) {
      if (!String(content).trim()) {
        return res.status(400).json({
          message: "Le contenu ne peut pas être vide.",
        });
      }
      post.content = String(content).trim();
    }

    if (title === undefined && content === undefined) {
      return res.status(400).json({
        message: "Aucune modification fournie.",
      });
    }

    post.isEdited = true;
    await post.save();

    return res.status(200).json({
      message: "Publication modifiée avec succès.",
      post,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * DELETE /api/interactions/posts/:postId
 */
exports.deletePost = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { postId } = req.params;
    const userId = getCurrentUserId(req);

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Identifiant de publication invalide.",
      });
    }

    let deletedPost;

    await session.withTransaction(async () => {
      const post = await ForumPost.findById(postId).session(session);

      if (!post) {
        const error = new Error("POST_NOT_FOUND");
        throw error;
      }

      if (post.authorId !== userId) {
        const error = new Error("FORBIDDEN");
        throw error;
      }

      deletedPost = post;
      await Comment.deleteMany({ postId: post._id }).session(session);
      await post.deleteOne({ session });
    });

    return res.status(200).json({
      message: "Publication et commentaires supprimés avec succès.",
      postId: deletedPost._id,
    });
  } catch (error) {
    if (error.message === "POST_NOT_FOUND") {
      return res.status(404).json({
        message: "Publication introuvable.",
      });
    }

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        message: "Tu ne peux supprimer que tes propres publications.",
      });
    }

    return sendError(res, error);
  } finally {
    await session.endSession();
  }
};

/**
 * PATCH /api/interactions/posts/:postId/reaction
 * body: { reaction: "like" | "dislike" }
 *
 * Envoyer la même réaction une deuxième fois la retire.
 */
exports.reactToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reaction } = req.body;
    const userId = getCurrentUserId(req);

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Identifiant de publication invalide.",
      });
    }

    if (!["like", "dislike"].includes(reaction)) {
      return res.status(400).json({
        message: 'La réaction doit être "like" ou "dislike".',
      });
    }

    const post = await updateReaction({
      model: ForumPost,
      documentId: postId,
      userId,
      reaction,
    });

    if (!post) {
      return res.status(404).json({
        message: "Publication introuvable.",
      });
    }

    return res.status(200).json({
      message: "Réaction mise à jour.",
      post,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * POST /api/interactions/posts/:postId/comments
 * body: { content, parentCommentId? }
 */
exports.createComment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { postId } = req.params;
    const { content, parentCommentId = null } = req.body;
    const authorId = getCurrentUserId(req);

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Identifiant de publication invalide.",
      });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        message: "Le contenu du commentaire est obligatoire.",
      });
    }

    if (parentCommentId && !isValidObjectId(parentCommentId)) {
      return res.status(400).json({
        message: "Identifiant du commentaire parent invalide.",
      });
    }

    let createdComment;

    await session.withTransaction(async () => {
      const post = await ForumPost.findById(postId).session(session);

      if (!post) {
        throw new Error("POST_NOT_FOUND");
      }

      let parentComment = null;

      if (parentCommentId) {
        parentComment = await Comment.findOne({
          _id: parentCommentId,
          postId: post._id,
        }).session(session);

        if (!parentComment) {
          throw new Error("PARENT_COMMENT_NOT_FOUND");
        }
      }

      const comments = await Comment.create(
        [
          {
            postId: post._id,
            parentCommentId: parentComment?._id ?? null,
            authorId,
            content: String(content).trim(),
          },
        ],
        { session },
      );

      createdComment = comments[0];

      post.commentsCount += 1;
      await post.save({ session });

      if (parentComment) {
        parentComment.repliesCount += 1;
        await parentComment.save({ session });
      }
    });

    return res.status(201).json({
      message: parentCommentId
        ? "Réponse ajoutée avec succès."
        : "Commentaire ajouté avec succès.",
      comment: createdComment,
    });
  } catch (error) {
    if (error.message === "POST_NOT_FOUND") {
      return res.status(404).json({
        message: "Publication introuvable.",
      });
    }

    if (error.message === "PARENT_COMMENT_NOT_FOUND") {
      return res.status(404).json({
        message: "Commentaire parent introuvable pour cette publication.",
      });
    }

    return sendError(res, error);
  } finally {
    await session.endSession();
  }
};

exports.comment = exports.createComment;

/**
 * GET /api/interactions/posts/:postId/comments?page=1&limit=20
 *
 * Retourne les commentaires racines. Les réponses sont récupérables avec
 * GET /api/interactions/comments/:commentId/replies
 */
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page, limit, skip } = getPagination(req.query);

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Identifiant de publication invalide.",
      });
    }

    const postExists = await ForumPost.exists({ _id: postId });

    if (!postExists) {
      return res.status(404).json({
        message: "Publication introuvable.",
      });
    }

    const filter = {
      postId,
      parentCommentId: null,
    };

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments(filter),
    ]);

    return res.status(200).json({
      comments: comments.map((comment) => ({
        ...comment,
        likeCount: comment.likes?.length ?? 0,
        dislikeCount: comment.dislikes?.length ?? 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.comments = exports.getPostComments;

/**
 * GET /api/interactions/comments/:commentId/replies?page=1&limit=20
 */
exports.getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page, limit, skip } = getPagination(req.query);

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        message: "Identifiant de commentaire invalide.",
      });
    }

    const parentExists = await Comment.exists({ _id: commentId });

    if (!parentExists) {
      return res.status(404).json({
        message: "Commentaire introuvable.",
      });
    }

    const filter = {
      parentCommentId: commentId,
    };

    const [replies, total] = await Promise.all([
      Comment.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments(filter),
    ]);

    return res.status(200).json({
      replies: replies.map((reply) => ({
        ...reply,
        likeCount: reply.likes?.length ?? 0,
        dislikeCount: reply.dislikes?.length ?? 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * PUT /api/interactions/comments/:commentId
 */
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = getCurrentUserId(req);

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        message: "Identifiant de commentaire invalide.",
      });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        message: "Le contenu du commentaire est obligatoire.",
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Commentaire introuvable.",
      });
    }

    if (comment.authorId !== userId) {
      return res.status(403).json({
        message: "Tu ne peux modifier que tes propres commentaires.",
      });
    }

    comment.content = String(content).trim();
    comment.isEdited = true;
    await comment.save();

    return res.status(200).json({
      message: "Commentaire modifié avec succès.",
      comment,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * DELETE /api/interactions/comments/:commentId
 */
exports.deleteComment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { commentId } = req.params;
    const userId = getCurrentUserId(req);

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        message: "Identifiant de commentaire invalide.",
      });
    }

    let deletedCount = 0;

    await session.withTransaction(async () => {
      const comment = await Comment.findById(commentId).session(session);

      if (!comment) {
        throw new Error("COMMENT_NOT_FOUND");
      }

      if (comment.authorId !== userId) {
        throw new Error("FORBIDDEN");
      }

      const descendants = await Comment.find({
        $or: [
          { _id: comment._id },
          { parentCommentId: comment._id },
        ],
      })
        .select("_id")
        .session(session);

      deletedCount = descendants.length;

      await Comment.deleteMany({
        _id: { $in: descendants.map((item) => item._id) },
      }).session(session);

      await ForumPost.updateOne(
        { _id: comment.postId },
        { $inc: { commentsCount: -deletedCount } },
        { session },
      );

      if (comment.parentCommentId) {
        await Comment.updateOne(
          { _id: comment.parentCommentId },
          { $inc: { repliesCount: -1 } },
          { session },
        );
      }
    });

    return res.status(200).json({
      message: "Commentaire supprimé avec succès.",
      deletedCount,
    });
  } catch (error) {
    if (error.message === "COMMENT_NOT_FOUND") {
      return res.status(404).json({
        message: "Commentaire introuvable.",
      });
    }

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        message: "Tu ne peux supprimer que tes propres commentaires.",
      });
    }

    return sendError(res, error);
  } finally {
    await session.endSession();
  }
};

/**
 * PATCH /api/interactions/comments/:commentId/reaction
 */
exports.reactToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reaction } = req.body;
    const userId = getCurrentUserId(req);

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        message: "Identifiant de commentaire invalide.",
      });
    }

    if (!["like", "dislike"].includes(reaction)) {
      return res.status(400).json({
        message: 'La réaction doit être "like" ou "dislike".',
      });
    }

    const comment = await updateReaction({
      model: Comment,
      documentId: commentId,
      userId,
      reaction,
    });

    if (!comment) {
      return res.status(404).json({
        message: "Commentaire introuvable.",
      });
    }

    return res.status(200).json({
      message: "Réaction mise à jour.",
      comment,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
