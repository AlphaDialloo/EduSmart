const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseCategory = require("../models/CourseCategory");
function sendError(res, error) {
  console.error("Course category controller error:", error);
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: "Identifiant invalide."
    });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: "Données invalides.",
      errors: Object.values(error.errors).map(item => item.message)
    });
  }
  if (error?.code === 11000) {
    return res.status(409).json({
      message: "Une catégorie portant ce nom ou ce slug existe déjà.",
      fields: error.keyValue
    });
  }
  return res.status(500).json({
    message: "Une erreur interne est survenue.",
    error: process.env.NODE_ENV === "development" ? error.message : undefined
  });
}
function sanitizePayload(body = {}) {
  const {
    _id,
    createdAt,
    updatedAt,
    ...allowedData
  } = body;
  return allowedData;
}
async function validateParentCategory(parentCategory, currentCategoryId = null) {
  if (parentCategory === null || parentCategory === undefined || parentCategory === "") {
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
    const error = new Error("L’identifiant de la catégorie parente est invalide.");
    error.statusCode = 400;
    throw error;
  }
  if (currentCategoryId && String(parentCategory) === String(currentCategoryId)) {
    const error = new Error("Une catégorie ne peut pas être sa propre catégorie parente.");
    error.statusCode = 400;
    throw error;
  }
  const parent = await CourseCategory.findById(parentCategory).select("_id");
  if (!parent) {
    const error = new Error("La catégorie parente est introuvable.");
    error.statusCode = 404;
    throw error;
  }
  return parent._id;
}
exports.listPublic = async (req, res) => {
  try {
    const categories = await CourseCategory.find({
      isActive: true
    }).populate("parentCategory", "name slug").sort({
      order: 1,
      name: 1
    }).lean();
    return res.status(200).json({
      categories,
      total: categories.length
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.listAll = async (req, res) => {
  try {
    const categories = await CourseCategory.find().populate("parentCategory", "name slug").sort({
      order: 1,
      name: 1
    }).lean();
    return res.status(200).json({
      categories,
      total: categories.length
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.getOne = async (req, res) => {
  try {
    const category = await CourseCategory.findById(req.params.id).populate("parentCategory", "name slug").lean();
    if (!category) {
      return res.status(404).json({
        message: "Catégorie introuvable."
      });
    }
    return res.status(200).json({
      category
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.create = async (req, res) => {
  try {
    const payload = sanitizePayload(req.body);
    payload.parentCategory = await validateParentCategory(payload.parentCategory);
    const category = await CourseCategory.create(payload);
    return res.status(201).json({
      message: "Catégorie créée avec succès.",
      category
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message
      });
    }
    return sendError(res, error);
  }
};
exports.update = async (req, res) => {
  try {
    const category = await CourseCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: "Catégorie introuvable."
      });
    }
    const payload = sanitizePayload(req.body);
    if (Object.prototype.hasOwnProperty.call(payload, "parentCategory")) {
      payload.parentCategory = await validateParentCategory(payload.parentCategory, category._id);
    }
    Object.assign(category, payload);
    await category.save();
    return res.status(200).json({
      message: "Catégorie modifiée avec succès.",
      category
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message
      });
    }
    return sendError(res, error);
  }
};
exports.setStatus = async (req, res) => {
  try {
    const {
      isActive
    } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive doit être un booléen."
      });
    }
    const category = await CourseCategory.findByIdAndUpdate(req.params.id, {
      isActive
    }, {
      new: true,
      runValidators: true
    });
    if (!category) {
      return res.status(404).json({
        message: "Catégorie introuvable."
      });
    }
    return res.status(200).json({
      message: isActive ? "Catégorie activée." : "Catégorie désactivée.",
      category
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.remove = async (req, res) => {
  try {
    const category = await CourseCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: "Catégorie introuvable."
      });
    }
    const [courseCount, childCount] = await Promise.all([Course.countDocuments({
      categoryId: category._id
    }), CourseCategory.countDocuments({
      parentCategory: category._id
    })]);
    if (courseCount > 0) {
      return res.status(409).json({
        message: "Cette catégorie est utilisée par un ou plusieurs cours. Désactivez-la au lieu de la supprimer.",
        courseCount
      });
    }
    if (childCount > 0) {
      return res.status(409).json({
        message: "Cette catégorie contient des sous-catégories et ne peut pas être supprimée.",
        childCount
      });
    }
    await category.deleteOne();
    return res.status(200).json({
      message: "Catégorie supprimée avec succès."
    });
  } catch (error) {
    return sendError(res, error);
  }
};
