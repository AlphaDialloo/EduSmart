const mongoose = require("mongoose");
const {
  Schema
} = mongoose;
const categoryImageSchema = new Schema({
  url: {
    type: String,
    trim: true,
    default: null,
    maxlength: 2000
  },
  publicId: {
    type: String,
    trim: true,
    default: null,
    maxlength: 500
  },
  altText: {
    type: String,
    trim: true,
    default: "",
    maxlength: 255
  }
}, {
  _id: false
});
const courseCategorySchema = new Schema({
  name: {
    type: String,
    required: [true, "Le nom de la catégorie est obligatoire."],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    minlength: 2,
    maxlength: 120,
    unique: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug doit contenir uniquement des lettres minuscules, des chiffres et des tirets."]
  },
  description: {
    type: String,
    trim: true,
    default: null,
    maxlength: 1000
  },
  icon: {
    type: String,
    trim: true,
    default: null,
    maxlength: 100
  },
  image: {
    type: categoryImageSchema,
    default: () => ({})
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: "CourseCategory",
    default: null,
    index: true
  },
  order: {
    type: Number,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});
courseCategorySchema.pre("validate", function normalizeCategory(next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  if (!this.slug && this.name) {
    this.slug = this.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  } else if (this.slug) {
    this.slug = this.slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  if (this.parentCategory && String(this.parentCategory) === String(this._id)) {
    return next(new Error("Une catégorie ne peut pas être sa propre catégorie parente."));
  }
  if (this.image?.url && !this.image.altText) {
    this.image.altText = this.name;
  }
  next();
});
courseCategorySchema.index({
  name: 1
}, {
  unique: true,
  collation: {
    locale: "fr",
    strength: 2
  }
});
courseCategorySchema.index({
  isActive: 1,
  order: 1,
  name: 1
});
courseCategorySchema.index({
  parentCategory: 1,
  isActive: 1,
  order: 1
});
module.exports = mongoose.model("CourseCategory", courseCategorySchema);
