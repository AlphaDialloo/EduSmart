const mongoose = require("mongoose");

const forumPostSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: [true, "courseId est obligatoire."],
      trim: true,
      index: true,
    },

    authorId: {
      type: String,
      required: [true, "authorId est obligatoire."],
      trim: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Le titre est obligatoire."],
      trim: true,
      minlength: [3, "Le titre doit contenir au moins 3 caractères."],
      maxlength: [200, "Le titre ne peut pas dépasser 200 caractères."],
    },

    content: {
      type: String,
      required: [true, "Le contenu est obligatoire."],
      trim: true,
      minlength: [3, "Le contenu doit contenir au moins 3 caractères."],
      maxlength: [10000, "Le contenu ne peut pas dépasser 10 000 caractères."],
    },

    likes: {
      type: [String],
      default: [],
    },

    dislikes: {
      type: [String],
      default: [],
    },

    commentsCount: {
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

forumPostSchema.index({ courseId: 1, createdAt: -1 });
forumPostSchema.index({ authorId: 1, createdAt: -1 });

forumPostSchema.set("toJSON", {
  virtuals: true,
  transform: (_document, returnedObject) => {
    returnedObject.likeCount = returnedObject.likes?.length ?? 0;
    returnedObject.dislikeCount = returnedObject.dislikes?.length ?? 0;
    return returnedObject;
  },
});

module.exports = mongoose.model("ForumPost", forumPostSchema);
