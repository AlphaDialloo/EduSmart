const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumPost",
      required: [true, "postId est obligatoire."],
      index: true,
    },

    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    authorId: {
      type: String,
      required: [true, "authorId est obligatoire."],
      trim: true,
      index: true,
    },

    content: {
      type: String,
      required: [true, "Le contenu du commentaire est obligatoire."],
      trim: true,
      minlength: [1, "Le commentaire ne peut pas être vide."],
      maxlength: [5000, "Le commentaire ne peut pas dépasser 5 000 caractères."],
    },

    likes: {
      type: [String],
      default: [],
    },

    dislikes: {
      type: [String],
      default: [],
    },

    repliesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ parentCommentId: 1, createdAt: 1 });
commentSchema.index({ authorId: 1, createdAt: -1 });

commentSchema.set("toJSON", {
  virtuals: true,
  transform: (_document, returnedObject) => {
    returnedObject.likeCount = returnedObject.likes?.length ?? 0;
    returnedObject.dislikeCount = returnedObject.dislikes?.length ?? 0;
    return returnedObject;
  },
});

module.exports = mongoose.model("Comment", commentSchema);
