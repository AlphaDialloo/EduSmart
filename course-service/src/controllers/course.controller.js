const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseCategory = require("../models/CourseCategory");
const CourseEnrollment = require("../models/courseEnrollment.model");

function findModule(course, moduleId) {
  const module = course.modules.id(moduleId);

  if (!module) {
    throw new Error("Module introuvable.");
  }

  return module;
}

function findResource(module, resourceId) {
  const resource = module.resources.id(resourceId);

  if (!resource) {
    throw new Error("Ressource introuvable.");
  }

  return resource;
}

function normalizeResourcePayload(payload) {
  return {
    title: payload.title,
    description: payload.description,
    type: payload.type,
    order: payload.order,
    durationSeconds: payload.durationSeconds || 0,
    isPreview: payload.isPreview || false,
    articleContent: payload.articleContent || "",
    video: payload.video || {},
    file: payload.file || {},
    image: payload.image || {},
    externalUrl: payload.externalUrl || "",
    thumbnailUrl: payload.thumbnailUrl || "",
    isDownloadable: payload.isDownloadable || false,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
  };
}

function isAdmin(user) {
  return user?.role === "ADMIN";
}

function canManageCourse(course, user) {
  if (!course || !user) {
    return false;
  }

  return isAdmin(user) || String(course.instructorId) === String(user.id);
}

function sanitizeThumbnailPayload(thumbnail, fallbackAltText = "") {
  if (thumbnail === null) {
    return {
      url: null,
      publicId: null,
      altText: "",
    };
  }

  if (!thumbnail || typeof thumbnail !== "object" || Array.isArray(thumbnail)) {
    return undefined;
  }

  const url = thumbnail.url ? String(thumbnail.url).trim() : null;
  const publicId = thumbnail.publicId
    ? String(thumbnail.publicId).trim()
    : null;
  const altText = String(thumbnail.altText || fallbackAltText || "").trim();

  return {
    url,
    publicId,
    altText,
  };
}

function sanitizeCourseCreationPayload(body = {}) {
  const {
    instructorId,
    sponsorship,
    publishedAt,
    archivedAt,
    createdAt,
    updatedAt,
    ...allowedData
  } = body;

  const thumbnail = sanitizeThumbnailPayload(
    allowedData.thumbnail,
    allowedData.title,
  );

  if (thumbnail !== undefined) {
    allowedData.thumbnail = thumbnail;
  } else {
    delete allowedData.thumbnail;
  }

  return {
    ...allowedData,

    sponsorship: {
      isSponsored: false,
      priorityLevel: 0,
      startsAt: null,
      endsAt: null,
      sponsorshipId: null,
    },
  };
}

function sanitizeResourcePayload(body = {}) {
  const {
    _id,
    createdAt,
    updatedAt,
    downloadUrl,
    downloadable,
    fileUrl,
    publicUrl,
    ...allowedData
  } = body;

  return {
    ...allowedData,
  };
}

async function validateCourseCategory(categoryId) {
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error("L’identifiant de la catégorie est invalide.");
    error.statusCode = 400;
    throw error;
  }

  const category = await CourseCategory.findOne({
    _id: categoryId,
    isActive: true,
  }).select("_id");

  if (!category) {
    const error = new Error("La catégorie est introuvable ou inactive.");
    error.statusCode = 404;
    throw error;
  }

  return category._id;
}

function sendError(res, error) {
  console.error("Course controller error:", error);

  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: "Identifiant invalide.",
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((item) => item.message);

    return res.status(400).json({
      message: "Données invalides.",
      errors,
    });
  }

  if (error?.code === 11000) {
    return res.status(409).json({
      message: "Une donnée identique existe déjà.",
      fields: error.keyValue,
    });
  }

  return res.status(500).json({
    message: "Une erreur interne est survenue.",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}

exports.listQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Accès refusé.",
      });
    }

    return res.json({
      quizzes: course.quizzes,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    const quiz = course.quizzes.id(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz introuvable.",
      });
    }

    return res.json({
      quiz,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getStudentQuiz = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;
    const studentId = req.user?.id || req.user?.userId || req.user?.sub;

    if (!studentId) {
      return res.status(401).json({
        message: "Utilisateur non authentifié.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: "Identifiant du cours invalide.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        message: "Identifiant du quiz invalide.",
      });
    }

    const now = new Date();

    const enrollment = await CourseEnrollment.findOne({
      studentId,
      courseId,
      status: "ACTIVE",
      $or: [
        { expiresAt: null },
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } },
      ],
    }).lean();

    if (!enrollment) {
      return res.status(403).json({
        message: "Vous n’avez pas accès à ce cours.",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      status: "PUBLISHED",
      isActive: true,
    });

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable ou indisponible.",
      });
    }

    const quiz = course.quizzes.id(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz introuvable.",
      });
    }

    if (quiz.isActive === false) {
      return res.status(403).json({
        message: "Ce quiz n’est pas disponible.",
      });
    }

    const questions = (quiz.questions || []).map((question) => ({
      id: String(question._id),
      question: question.question,
      type: question.type,
      points: question.points,
      order: question.order,
      options: (question.options || []).map((option) => ({
        id: String(option._id),
        text: option.text,
      })),
    }));

    return res.status(200).json({
      quiz: {
        id: String(quiz._id),
        courseId: String(course._id),
        moduleId: quiz.moduleId ? String(quiz.moduleId) : null,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        timeLimitMinutes: quiz.timeLimitMinutes,
        maxAttempts: quiz.maxAttempts,
        questions,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Accès refusé.",
      });
    }

    const quiz = course.quizzes.id(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz introuvable.",
      });
    }

    Object.assign(quiz, req.body);

    await course.save();

    return res.json({
      message: "Quiz modifié.",

      quiz,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Accès refusé.",
      });
    }

    const quiz = course.quizzes.id(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz introuvable.",
      });
    }

    quiz.deleteOne();

    await course.save();

    return res.json({
      message: "Quiz supprimé.",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.addQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res
        .status(400)
        .json({ message: "Identifiant du cours invalide." });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Cours introuvable." });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n’êtes pas autorisé à modifier ce cours.",
      });
    }

    const {
      title,
      description,
      moduleId,
      passingScore,
      timeLimitMinutes,
      maxAttempts,
      questions,
      isActive,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        message: "Le titre du quiz est obligatoire.",
      });
    }

    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        message: "L’identifiant du module est invalide.",
      });
    }

    const moduleExists = course.modules.some(
      (module) => String(module._id) === String(moduleId),
    );

    if (!moduleExists) {
      return res.status(404).json({
        message: "Le module indiqué n’existe pas dans ce cours.",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "Le quiz doit contenir au moins une question.",
      });
    }

    const normalizedQuestions = questions.map((question, index) => ({
      question: question?.question,
      type: question?.type || "SINGLE_CHOICE",
      options: Array.isArray(question?.options) ? question.options : [],
      points: question?.points ?? 1,
      explanation: question?.explanation?.trim() || null,
      order: question?.order ?? index + 1,
    }));

    const quiz = {
      title: String(title).trim(),
      description: description?.trim() || null,
      moduleId,
      passingScore: passingScore ?? 70,
      timeLimitMinutes: timeLimitMinutes ?? null,
      maxAttempts: maxAttempts ?? 3,
      questions: normalizedQuestions,
      isActive: isActive ?? true,
    };

    course.quizzes.push(quiz);

    await course.save();

    return res.status(201).json({
      message: "Quiz ajouté avec succès.",
      quiz: course.quizzes[course.quizzes.length - 1],
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    console.log("Utilisateur authentifié :", req.user);
    const payload = sanitizeCourseCreationPayload(req.body);

    payload.categoryId = await validateCourseCategory(payload.categoryId);

    const fullName = [req.user.firstName, req.user.lastName]
      .filter(Boolean)
      .join(" ");

    const course = await Course.create({
      ...payload,

      instructorId: req.user.id,

      instructor: {
        firstName: req.user.firstName || null,
        lastName: req.user.lastName || null,
        fullName: fullName || "Formateur EduSmart",
      },

      status: "DRAFT",
    });

    return res.status(201).json({
      message: "Cours créé avec succès.",
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.list = async (req, res) => {
  try {
    const {
      level,
      category,
      language,
      planType,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const normalizedPage = Math.max(Number(page) || 1, 1);
    const normalizedLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);

    const filter = {
      status: "PUBLISHED",
      isActive: true,
    };

    if (level) {
      filter.level = String(level).toUpperCase();
    }

    if (category) {
      const normalizedCategory = String(category).trim();

      if (mongoose.Types.ObjectId.isValid(normalizedCategory)) {
        filter.categoryId = normalizedCategory;
      } else {
        const matchingCategories = await CourseCategory.find({
          isActive: true,
          $or: [
            { slug: normalizedCategory.toLowerCase() },
            { name: { $regex: normalizedCategory, $options: "i" } },
          ],
        }).select("_id");

        filter.categoryId = {
          $in: matchingCategories.map((item) => item._id),
        };
      }
    }

    if (language) {
      filter.language = String(language).trim().toLowerCase();
    }

    if (planType) {
      filter["pricing.accessPlans"] = {
        $elemMatch: {
          planType: String(planType).toUpperCase(),
          isActive: true,
        },
      };
    }

    if (search?.trim()) {
      filter.$text = {
        $search: search.trim(),
      };
    }

    const now = new Date();

    const sort = search?.trim()
      ? {
          score: {
            $meta: "textScore",
          },
        }
      : {
          "sponsorship.isSponsored": -1,
          "sponsorship.priorityLevel": -1,
          createdAt: -1,
        };

    const projection = search?.trim()
      ? {
          score: {
            $meta: "textScore",
          },
        }
      : {};

    const [courses, total] = await Promise.all([
      Course.find(filter, projection)
        .populate("categoryId", "name slug icon image parentCategory")
        .sort(sort)
        .skip((normalizedPage - 1) * normalizedLimit)
        .limit(normalizedLimit)
        .lean(),

      Course.countDocuments(filter),
    ]);

    const normalizedCourses = courses.map((course) => {
      const sponsorship = course.sponsorship;

      const hasActiveSponsorship = Boolean(
        sponsorship?.isSponsored &&
        sponsorship?.startsAt &&
        sponsorship?.endsAt &&
        new Date(sponsorship.startsAt) <= now &&
        new Date(sponsorship.endsAt) > now,
      );

      return {
        ...course,

        sponsorship: {
          ...sponsorship,
          isSponsored: hasActiveSponsorship,

          priorityLevel: hasActiveSponsorship ? sponsorship.priorityLevel : 0,
        },
      };
    });

    return res.status(200).json({
      courses: normalizedCourses,

      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getOne = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      status: "PUBLISHED",
      isActive: true,
    }).populate("categoryId", "name slug icon image parentCategory");

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    course.clearExpiredSponsorship();

    return res.status(200).json({
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getOneForManagement = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "categoryId",
      "name slug icon image parentCategory isActive",
    );

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à consulter ce cours.",
      });
    }

    return res.status(200).json({
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.listMine = async (req, res) => {
  try {
    const filter = isAdmin(req.user)
      ? {}
      : {
          instructorId: req.user.id,
        };

    const courses = await Course.find(filter)
      .populate("categoryId", "name slug icon image parentCategory isActive")
      .sort({
        updatedAt: -1,
      });

    return res.status(200).json({
      courses,
      total: courses.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.update = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier ce cours.",
      });
    }

    const forbiddenFields = [
      "_id",
      "instructorId",
      "modules",
      "quizzes",
      "sponsorship",
      "publishedAt",
      "archivedAt",
      "createdAt",
      "updatedAt",
    ];

    const allowedData = {
      ...req.body,
    };

    for (const field of forbiddenFields) {
      delete allowedData[field];
    }

    if (Object.prototype.hasOwnProperty.call(allowedData, "categoryId")) {
      allowedData.categoryId = await validateCourseCategory(
        allowedData.categoryId,
      );
    }

    if (Object.prototype.hasOwnProperty.call(allowedData, "thumbnail")) {
      const thumbnail = sanitizeThumbnailPayload(
        allowedData.thumbnail,
        allowedData.title || course.title,
      );

      if (thumbnail === undefined) {
        return res.status(400).json({
          message: "Le format de l'image du cours est invalide.",
        });
      }

      allowedData.thumbnail = thumbnail;
    }

    course.title = allowedData.title ?? course.title;

    course.description = allowedData.description ?? course.description;

    course.language = allowedData.language ?? course.language;

    course.level = allowedData.level ?? course.level;

    course.tags = allowedData.tags ?? course.tags;

    course.thumbnail = allowedData.thumbnail ?? course.thumbnail;

    course.pricing = allowedData.pricing ?? course.pricing;

    await course.save();

    return res.status(200).json({
      message: "Cours modifié avec succès.",
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.addModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier ce cours.",
      });
    }

    const { _id, createdAt, updatedAt, resources, ...moduleData } = req.body;

    const moduleOrder = moduleData.order || course.modules.length + 1;

    course.modules.push({
      ...moduleData,
      order: moduleOrder,
      resources: Array.isArray(resources)
        ? resources.map(sanitizeResourcePayload)
        : [],
    });

    await course.save();

    const addedModule = course.modules[course.modules.length - 1];

    return res.status(201).json({
      message: "Module ajouté avec succès.",
      module: addedModule,
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * PUT /api/courses/:courseId/modules/:moduleId
 *
 * Modifie un module existant.
 */
exports.updateModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier ce cours.",
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        message: "Module introuvable.",
      });
    }

    const { _id, resources, createdAt, updatedAt, ...moduleData } = req.body;

    Object.assign(module, moduleData);

    await course.save();

    return res.status(200).json({
      message: "Module modifié avec succès.",
      module,
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { accessPlanId } = req.query;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    console.log("Cours trouvé pour paiement :", {
      id: String(course._id),
      status: course.status,
      isActive: course.isActive,
      isFree: course.pricing?.isFree,
      accessPlanId,
    });

    /*
     * Le cours est achetable uniquement lorsqu'il est publié
     * et qu'il n'est pas explicitement désactivé.
     */
    if (
      String(course.status).toUpperCase() !== "PUBLISHED" ||
      course.isActive === false
    ) {
      return res.status(400).json({
        message: "Ce cours n'est pas disponible à l'achat.",
        debug: {
          courseId: String(course._id),
          status: course.status,
          isActive: course.isActive,
        },
      });
    }

    if (!course.pricing) {
      return res.status(400).json({
        message: "La tarification du cours est introuvable.",
      });
    }

    if (course.pricing.isFree) {
      return res.status(200).json({
        courseId: String(course._id),
        instructorId: course.instructorId,
        title: course.title,
        countryCode: course.countryCode || "CA",
        isFree: true,
        amount: 0,
        currency: course.pricing.baseCurrency || "CAD",
        accessPlanId: null,
        commissionRate: Number(course.pricing.platformCommissionRate) || 0,
      });
    }

    if (!accessPlanId) {
      return res.status(400).json({
        message: "accessPlanId est obligatoire pour un cours payant.",
      });
    }

    const selectedPlan = course.pricing.accessPlans.id(accessPlanId);

    if (!selectedPlan) {
      return res.status(404).json({
        message: "Plan d'accès introuvable.",
      });
    }

    if (selectedPlan.isActive === false) {
      return res.status(400).json({
        message: "Ce plan d'accès n'est pas disponible.",
      });
    }

    return res.status(200).json({
      courseId: String(course._id),
      instructorId: course.instructorId,
      title: course.title,
      countryCode: course.countryCode || "CA",
      isFree: false,
      amount: Number(selectedPlan.price),
      currency: course.pricing.baseCurrency,
      accessPlanId: String(selectedPlan._id),
      planType: selectedPlan.planType,
      durationMonths: selectedPlan.durationMonths,
      commissionRate: Number(course.pricing.platformCommissionRate) || 0,
    });
  } catch (error) {
    console.error("Erreur getPaymentDetails :", error);

    return res.status(500).json({
      message: "Erreur lors de la récupération des informations de paiement.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.grantAccess = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { studentId, paymentId, accessPlanId } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validation des données reçues
    |--------------------------------------------------------------------------
    */

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: "Identifiant de cours invalide.",
      });
    }

    if (!studentId || !paymentId || !accessPlanId) {
      return res.status(400).json({
        message: "studentId, paymentId et accessPlanId sont obligatoires.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(accessPlanId)) {
      return res.status(400).json({
        message: "Identifiant de plan d’accès invalide.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Recherche et validation du cours
    |--------------------------------------------------------------------------
    */

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!course.isActive) {
      return res.status(409).json({
        message: "Ce cours est désactivé.",
      });
    }

    if (course.status !== "PUBLISHED") {
      return res.status(409).json({
        message: "Ce cours n’est pas publié.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Recherche du plan dans pricing.accessPlans
    |--------------------------------------------------------------------------
    */

    const accessPlans = course.pricing?.accessPlans;

    if (!accessPlans || accessPlans.length === 0) {
      return res.status(409).json({
        message: "Aucun plan d’accès n’est configuré pour ce cours.",
      });
    }

    const accessPlan = accessPlans.id(accessPlanId);

    if (!accessPlan) {
      return res.status(404).json({
        message: "Plan d’accès introuvable pour ce cours.",
      });
    }

    if (!accessPlan.isActive) {
      return res.status(409).json({
        message: "Ce plan d’accès n’est plus actif.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Idempotence par paiement
    |--------------------------------------------------------------------------
    |
    | Si ce paiement a déjà accordé un accès, on retourne l'inscription
    | existante sans créer de doublon.
    |
    */

    const existingByPayment = await CourseEnrollment.findOne({
      paymentId,
    });

    if (existingByPayment) {
      return res.status(200).json({
        message: "L’accès a déjà été accordé pour ce paiement.",
        enrollment: existingByPayment,
        created: false,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Calcul de la date d’expiration
    |--------------------------------------------------------------------------
    */

    const grantedAt = new Date();

    const expiresAt = new Date(grantedAt);

    expiresAt.setMonth(
      expiresAt.getMonth() + Number(accessPlan.durationMonths),
    );

    /*
    |--------------------------------------------------------------------------
    | Copie des fonctionnalités du plan
    |--------------------------------------------------------------------------
    */

    const features =
      typeof accessPlan.features?.toObject === "function"
        ? accessPlan.features.toObject()
        : {
            courseContent: accessPlan.features?.courseContent ?? true,

            forumAccess: accessPlan.features?.forumAccess ?? false,

            instructorMessaging:
              accessPlan.features?.instructorMessaging ?? false,

            personalizedFollowUp:
              accessPlan.features?.personalizedFollowUp ?? false,

            assignmentCorrection:
              accessPlan.features?.assignmentCorrection ?? false,

            certificateAccess: accessPlan.features?.certificateAccess ?? true,
          };

    /*
    |--------------------------------------------------------------------------
    | Création ou renouvellement de l’inscription
    |--------------------------------------------------------------------------
    |
    | Un étudiant possède une seule inscription par cours.
    | Un nouvel achat peut renouveler ou remplacer son ancien accès.
    |
    */

    const enrollment = await CourseEnrollment.findOneAndUpdate(
      {
        courseId: course._id,
        studentId,
      },
      {
        $set: {
          paymentId,
          accessPlanId: accessPlan._id,
          planType: accessPlan.planType,
          durationMonths: accessPlan.durationMonths,
          features,
          status: "ACTIVE",
          grantedAt,
          expiresAt,
          revokedAt: null,
        },

        $setOnInsert: {
          courseId: course._id,
          studentId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      message: "Accès au cours accordé.",
      enrollment,
      created: true,
    });
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Gestion d’une éventuelle concurrence
    |--------------------------------------------------------------------------
    |
    | Deux appels identiques peuvent arriver presque simultanément.
    | L’index unique sur paymentId empêchera le doublon.
    |
    */

    if (error?.code === 11000) {
      try {
        const existingEnrollment = await CourseEnrollment.findOne({
          paymentId: req.body.paymentId,
        });

        if (existingEnrollment) {
          return res.status(200).json({
            message: "L’accès a déjà été accordé pour ce paiement.",
            enrollment: existingEnrollment,
            created: false,
          });
        }
      } catch (lookupError) {
        return next(lookupError);
      }
    }

    return next(error);
  }
};
/**
 * DELETE /api/courses/:courseId/modules/:moduleId
 *
 * Supprime un module et ses ressources.
 */
exports.deleteModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier ce cours.",
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        message: "Module introuvable.",
      });
    }

    module.deleteOne();

    await course.save();

    return res.status(200).json({
      message: "Module supprimé avec succès.",
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * POST /api/courses/:courseId/modules/:moduleId/resources
 *
 * Ajoute une ressource consultable sur la plateforme.
 */
exports.addResource = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier ce cours.",
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        message: "Module introuvable.",
      });
    }

    const payload = normalizeResourcePayload(req.body);

    module.resources.push({
      ...payload,
      order: payload.order ?? module.resources.length + 1,
    });

    await course.save();

    const resource = module.resources[module.resources.length - 1];

    return res.status(201).json({
      message: "Ressource ajoutée.",

      resource,

      module,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * PUT
 * /api/courses/:courseId/modules/:moduleId/resources/:resourceId
 *
 * Modifie une ressource.
 */
exports.updateResource = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier ce cours.",
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        message: "Module introuvable.",
      });
    }

    const resource = module.resources.id(req.params.resourceId);

    if (!resource) {
      return res.status(404).json({
        message: "Ressource introuvable.",
      });
    }

    const resourceData = sanitizeResourcePayload(req.body);

    const payload = normalizeResourcePayload(req.body);

    resource.title = payload.title;
    resource.description = payload.description;
    resource.type = payload.type;
    resource.order = payload.order;
    resource.durationSeconds = payload.durationSeconds;
    resource.isPreview = payload.isPreview;
    resource.articleContent = payload.articleContent;

    resource.video = payload.video;
    resource.file = payload.file;
    resource.image = payload.image;

    resource.externalUrl = payload.externalUrl;
    resource.thumbnailUrl = payload.thumbnailUrl;

    resource.isDownloadable = payload.isDownloadable;
    resource.isActive = payload.isActive;

    await course.save();

    return res.status(200).json({
      message: "Ressource modifiée avec succès.",
      resource,
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * DELETE
 * /api/courses/:courseId/modules/:moduleId/resources/:resourceId
 *
 * Supprime une ressource.
 */
exports.deleteResource = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier ce cours.",
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        message: "Module introuvable.",
      });
    }

    const resource = module.resources.id(req.params.resourceId);

    if (!resource) {
      return res.status(404).json({
        message: "Ressource introuvable.",
      });
    }

    const { deleteFile } = require("../services/upload.service");

    if (resource.video?.publicId) {
      await deleteFile(resource.video.publicId);
    }

    if (resource.file?.publicId) {
      await deleteFile(resource.file.publicId);
    }

    if (resource.image?.publicId) {
      await deleteFile(resource.image.publicId);
    }

    resource.deleteOne();

    await course.save();

    return res.status(200).json({
      message: "Ressource supprimée avec succès.",
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * PATCH /api/courses/:id/publish
 *
 * Publie un cours lorsque sa structure est suffisamment complète.
 */
exports.publish = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à publier ce cours.",
      });
    }

    if (!course.canPublish()) {
      return res.status(400).json({
        message: "Le cours est incomplet.",
      });
    }

    const activeModules = course.modules.filter((module) => module.isActive);

    if (!activeModules.length) {
      return res.status(400).json({
        message: "Le cours doit contenir au moins un module actif.",
      });
    }

    const hasActiveResource = activeModules.some((module) =>
      module.resources.some((resource) => resource.isActive),
    );

    if (!hasActiveResource) {
      return res.status(400).json({
        message: "Le cours doit contenir au moins une ressource active.",
      });
    }

    if (
      !course.pricing?.isFree &&
      !course.pricing?.accessPlans?.some((plan) => plan.isActive)
    ) {
      return res.status(400).json({
        message:
          "Un cours payant doit contenir au moins un plan d'accès actif.",
      });
    }

    course.status = "PUBLISHED";

    await course.save();

    return res.status(200).json({
      message: "Cours publié avec succès.",
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.unpublish = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à retirer ce cours.",
      });
    }

    course.status = "DRAFT";

    await course.save();

    return res.status(200).json({
      message: "Le cours a été replacé en brouillon.",
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};


exports.enrollFreeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?.id || req.user?.userId || req.user?.sub;

    if (!studentId) {
      return res.status(401).json({
        message: "Utilisateur non authentifié.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: "Identifiant du cours invalide.",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      status: "PUBLISHED",
      isActive: true,
    });

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable ou indisponible.",
      });
    }

    if (course.pricing?.isFree !== true) {
      return res.status(409).json({
        message: "Ce cours n’est pas gratuit.",
      });
    }

    const features = {
      courseContent: true,
      forumAccess: false,
      instructorMessaging: false,
      personalizedFollowUp: false,
      assignmentCorrection: false,
      certificateAccess: true,
    };

    const existingEnrollment = await CourseEnrollment.findOne({
      courseId: course._id,
      studentId,
    });

    if (existingEnrollment) {
      existingEnrollment.status = "ACTIVE";
      existingEnrollment.accessPlanId = null;
      existingEnrollment.planType = "FREE";
      existingEnrollment.durationMonths = null;
      existingEnrollment.expiresAt = null;
      existingEnrollment.revokedAt = null;
      existingEnrollment.features = features;

      if (!existingEnrollment.grantedAt) {
        existingEnrollment.grantedAt = new Date();
      }

      await existingEnrollment.save();

      return res.status(200).json({
        message: "Vous êtes déjà inscrit à ce cours.",
        enrollment: existingEnrollment,
        created: false,
      });
    }

    const enrollment = await CourseEnrollment.create({
      courseId: course._id,
      studentId,
      accessPlanId: null,
      planType: "FREE",
      durationMonths: null,
      status: "ACTIVE",
      grantedAt: new Date(),
      expiresAt: null,
      revokedAt: null,
      features,
    });

    return res.status(201).json({
      message: "Inscription gratuite réussie.",
      enrollment,
      created: true,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getStudentCourses = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.userId;

    if (!studentId) {
      return res.status(401).json({
        message: "Utilisateur non authentifié.",
      });
    }

    const now = new Date();

    const enrollments = await CourseEnrollment.find({
      studentId,
      status: "ACTIVE",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ grantedAt: -1 })
      .lean();

    if (enrollments.length === 0) {
      return res.status(200).json({
        count: 0,
        courses: [],
      });
    }

    const courseIds = enrollments.map((enrollment) => enrollment.courseId);

    const courses = await Course.find({
      _id: { $in: courseIds },
      isActive: true,
    })
      .populate("categoryId", "name slug icon image parentCategory")
      .lean();

    const courseMap = new Map(
      courses.map((course) => [course._id.toString(), course]),
    );

    const studentCourses = enrollments
      .map((enrollment) => {
        const course = courseMap.get(enrollment.courseId.toString());

        if (!course) {
          return null;
        }

        return {
          enrollmentId: enrollment._id,
          status: enrollment.status,
          planType: enrollment.planType,
          durationMonths: enrollment.durationMonths,
          grantedAt: enrollment.grantedAt,
          expiresAt: enrollment.expiresAt,
          features: enrollment.features,
          course,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      count: studentCourses.length,
      courses: studentCourses,
    });
  } catch (error) {
    console.error("Erreur récupération cours étudiant :", error);

    return res.status(500).json({
      message: "Erreur lors de la récupération des cours de l’étudiant.",
    });
  }
};

exports.getStudentCourseById = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.userId || req.user?.sub;

    const { courseId } = req.params;

    if (!studentId) {
      return res.status(401).json({
        message: "Utilisateur non authentifié.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: "Identifiant de cours invalide.",
      });
    }

    const now = new Date();

    const enrollment = await CourseEnrollment.findOne({
      studentId,
      courseId,
      status: "ACTIVE",
      $or: [
        { expiresAt: null },
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } },
      ],
    }).lean();

    if (!enrollment) {
      return res.status(403).json({
        message: "Vous n’avez pas accès à ce cours.",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      status: "PUBLISHED",
      isActive: true,
    })
      .select(
        [
          "_id",
          "title",
          "description",
          "categoryId",
          "level",
          "language",
          "tags",
          "instructorId",
          "thumbnail",
          "thumbnailAssetId",
          "modules",
          "quizzes",
          "publishedAt",
        ].join(" "),
      )
      .populate("categoryId", "name slug icon image parentCategory")
      .lean();

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable ou indisponible.",
      });
    }

    /*
     * On ne retourne que les modules actifs.
     * Les modules sont triés par ordre croissant.
     * Les ressources inactives sont retirées.
     * Les ressources sont également triées.
     */
    const modules = (course.modules || [])
      .filter((module) => module.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((module) => ({
        _id: module._id,
        title: module.title,
        description: module.description,
        order: module.order,

        resources: (module.resources || [])
          .filter((resource) => resource.isActive !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((resource) => ({
            _id: resource._id,
            title: resource.title,
            description: resource.description,
            type: resource.type,
            durationMinutes: resource.durationMinutes,
            order: resource.order,
            isPreview: resource.isPreview,

            video: resource.video,

            file: resource.file,

            image: resource.image,

            thumbnailUrl: resource.thumbnailUrl,

            isDownloadable: resource.isDownloadable,
          })),
      }));

    /*
     * On filtre également les quiz inactifs, si le schéma
     * contient le champ isActive.
     */
    const quizzes = (course.quizzes || [])
      .filter((quiz) => quiz.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((quiz) => ({
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        order: quiz.order,
      }));

    return res.status(200).json({
      enrollment: {
        id: enrollment._id,
        status: enrollment.status,
        planType: enrollment.planType,
        durationMonths: enrollment.durationMonths,
        grantedAt: enrollment.grantedAt,
        expiresAt: enrollment.expiresAt,
        features: enrollment.features,
      },

      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        category: course.categoryId,
        categoryId: course.categoryId?._id || course.categoryId,
        level: course.level,
        language: course.language,
        tags: course.tags || [],
        instructorId: course.instructorId,
        thumbnail: course.thumbnail || {
          url: null,
          publicId: null,
          altText: course.title,
        },
        thumbnailAssetId: course.thumbnailAssetId,
        publishedAt: course.publishedAt,
        modules,
        quizzes,
      },
    });
  } catch (error) {
    console.error("Erreur récupération du cours de l’étudiant :", error);

    return res.status(500).json({
      message: "Une erreur est survenue lors de la récupération du cours.",
    });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;
    const { answers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: "Identifiant du cours invalide.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        message: "Identifiant du quiz invalide.",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Le champ answers doit être un tableau.",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      status: "PUBLISHED",
      isActive: true,
    });

    if (!course) {
      return res.status(404).json({
        message: "Cours publié introuvable.",
      });
    }

    const quiz = course.quizzes.id(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz introuvable.",
      });
    }

    if (!quiz.isActive) {
      return res.status(403).json({
        message: "Ce quiz n’est pas disponible.",
      });
    }

    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return res.status(400).json({
        message: "Ce quiz ne contient aucune question.",
      });
    }

    /*
     * Format attendu :
     *
     * answers: [
     *   {
     *     questionId: "...",
     *     selectedOptionIds: ["...", "..."]
     *   }
     * ]
     */

    const answersByQuestionId = new Map();

    for (const answer of answers) {
      if (!answer || !answer.questionId) {
        return res.status(400).json({
          message: "Chaque réponse doit contenir un identifiant de question.",
        });
      }

      const questionId = String(answer.questionId);

      if (answersByQuestionId.has(questionId)) {
        return res.status(400).json({
          message: `La question ${questionId} a été envoyée plusieurs fois.`,
        });
      }

      const selectedOptionIds = Array.isArray(answer.selectedOptionIds)
        ? answer.selectedOptionIds.map(String)
        : [];

      const uniqueSelectedOptionIds = [...new Set(selectedOptionIds)];

      answersByQuestionId.set(questionId, uniqueSelectedOptionIds);
    }

    const quizQuestionIds = new Set(
      quiz.questions.map((question) => String(question._id)),
    );

    for (const questionId of answersByQuestionId.keys()) {
      if (!quizQuestionIds.has(questionId)) {
        return res.status(400).json({
          message: `La question ${questionId} n’appartient pas à ce quiz.`,
        });
      }
    }

    let earnedPoints = 0;

    const totalPoints = quiz.questions.reduce(
      (total, question) => total + Number(question.points || 1),
      0,
    );

    const details = quiz.questions.map((question) => {
      const questionId = String(question._id);
      const selectedOptionIds = answersByQuestionId.get(questionId) || [];

      const validOptionIds = new Set(
        question.options.map((option) => String(option._id)),
      );

      const containsInvalidOption = selectedOptionIds.some(
        (optionId) => !validOptionIds.has(optionId),
      );

      const correctOptionIds = question.options
        .filter((option) => option.isCorrect === true)
        .map((option) => String(option._id));

      const normalizedSelectedOptionIds = [...selectedOptionIds].sort();
      const normalizedCorrectOptionIds = [...correctOptionIds].sort();

      let isCorrect = false;

      if (!containsInvalidOption) {
        isCorrect =
          normalizedSelectedOptionIds.length ===
            normalizedCorrectOptionIds.length &&
          normalizedSelectedOptionIds.every(
            (optionId, index) => optionId === normalizedCorrectOptionIds[index],
          );
      }

      const questionPoints = Number(question.points || 1);
      const pointsEarned = isCorrect ? questionPoints : 0;

      earnedPoints += pointsEarned;

      return {
        questionId,
        question: question.question,
        type: question.type,

        selectedOptionIds,
        correctOptionIds,

        isAnswered: selectedOptionIds.length > 0,
        isCorrect,

        pointsPossible: questionPoints,
        pointsEarned,

        explanation: question.explanation || null,
      };
    });

    const score =
      totalPoints > 0
        ? Number(((earnedPoints / totalPoints) * 100).toFixed(2))
        : 0;

    const passingScore = Number(quiz.passingScore ?? 70);
    const passed = score >= passingScore;

    const answeredQuestions = details.filter(
      (detail) => detail.isAnswered,
    ).length;

    const correctAnswers = details.filter((detail) => detail.isCorrect).length;

    return res.status(200).json({
      message: passed
        ? "Quiz réussi avec succès."
        : "Quiz terminé, mais la note de passage n’a pas été atteinte.",

      result: {
        courseId: String(course._id),
        quizId: String(quiz._id),
        moduleId: String(quiz.moduleId),

        studentId: String(req.user.id),

        score,
        passingScore,
        passed,

        earnedPoints,
        totalPoints,

        totalQuestions: quiz.questions.length,
        answeredQuestions,
        unansweredQuestions: quiz.questions.length - answeredQuestions,
        correctAnswers,
        incorrectAnswers: quiz.questions.length - correctAnswers,

        submittedAt: new Date(),

        details,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.archive = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à archiver ce cours.",
      });
    }

    course.status = "ARCHIVED";

    await course.save();

    return res.status(200).json({
      message: "Cours archivé avec succès.",
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * GET /api/courses/management/instructor-dashboard
 *
 * Tableau de bord du formateur connecté.
 */
exports.instructorDashboard = async (req, res) => {
  try {
    const instructorId = req.user?.id;

    if (!instructorId) {
      return res.status(401).json({
        message: "Utilisateur non authentifié.",
      });
    }

    const courses = await Course.find({
      instructorId,
    })
      .populate("categoryId", "name slug icon image")
      .sort({
        updatedAt: -1,
      })
      .lean();

    const courseIds = courses.map((course) => course._id);

    const enrollments = courseIds.length
      ? await CourseEnrollment.find({
          courseId: {
            $in: courseIds,
          },
        })
          .sort({
            grantedAt: -1,
          })
          .lean()
      : [];

    const uniqueStudents = new Set(
      enrollments.map((enrollment) => String(enrollment.studentId)),
    );

    const enrollmentCountByCourse = enrollments.reduce(
      (accumulator, enrollment) => {
        const courseId = String(enrollment.courseId);

        accumulator[courseId] = (accumulator[courseId] || 0) + 1;

        return accumulator;
      },
      {},
    );

    const activeEnrollments = enrollments.filter(
      (enrollment) =>
        enrollment.status === "ACTIVE" &&
        (!enrollment.expiresAt || new Date(enrollment.expiresAt) > new Date()),
    );

    const totalModules = courses.reduce(
      (total, course) =>
        total + (Array.isArray(course.modules) ? course.modules.length : 0),
      0,
    );

    const totalResources = courses.reduce(
      (total, course) =>
        total +
        (Array.isArray(course.modules)
          ? course.modules.reduce(
              (moduleTotal, module) =>
                moduleTotal +
                (Array.isArray(module.resources) ? module.resources.length : 0),
              0,
            )
          : 0),
      0,
    );

    const normalizedCourses = courses.map((course) => ({
      id: course._id,
      title: course.title,
      description: course.description,

      status: course.status,
      isActive: course.isActive,

      category: course.categoryId?.name || "Sans catégorie",

      thumbnail: course.thumbnail?.url || null,

      level: course.level,
      language: course.language,

      modulesCount: course.modules?.length || 0,

      resourcesCount:
        course.modules?.reduce(
          (total, module) => total + (module.resources?.length || 0),
          0,
        ) || 0,

      quizzesCount: course.quizzes?.length || 0,

      studentsCount: enrollmentCountByCourse[String(course._id)] || 0,

      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      publishedAt: course.publishedAt,
    }));

    return res.status(200).json({
      stats: {
        totalCourses: courses.length,

        publishedCourses: courses.filter(
          (course) => course.status === "PUBLISHED",
        ).length,

        draftCourses: courses.filter((course) => course.status === "DRAFT")
          .length,

        archivedCourses: courses.filter(
          (course) => course.status === "ARCHIVED",
        ).length,

        totalStudents: uniqueStudents.size,

        totalEnrollments: enrollments.length,

        activeEnrollments: activeEnrollments.length,

        totalModules,

        totalResources,
      },

      recentCourses: normalizedCourses.slice(0, 5),

      courses: normalizedCourses,

      recentEnrollments: enrollments.slice(0, 5),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.adminSummary = async (req, res) => {
  try {
    const [totalCourses, published, drafts, archived, recentCourses] =
      await Promise.all([
        Course.countDocuments(),

        Course.countDocuments({
          status: "PUBLISHED",
        }),

        Course.countDocuments({
          status: "DRAFT",
        }),

        Course.countDocuments({
          status: "ARCHIVED",
        }),

        Course.find()
          .sort({
            createdAt: -1,
          })
          .limit(5)
          .select("title status thumbnail instructor createdAt")
          .lean(),
      ]);

    return res.json({
      stats: {
        totalCourses,
        publishedCourses: published,
        draftCourses: drafts,
        archivedCourses: archived,
      },

      recentCourses,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.adminList = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);

    const limit = Number(req.query.limit || 20);

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      filter.title = {
        $regex: req.query.search,
        $options: "i",
      };
    }

    const total = await Course.countDocuments(filter);

    const courses = await Course.find(filter)
      .populate("categoryId", "name")
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      courses,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.adminUpdateStatus = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Cours introuvable.",
      });
    }

    const { status, isActive } = req.body;

    if (status) {
      course.status = status;
    }

    if (typeof isActive === "boolean") {
      course.isActive = isActive;
    }

    await course.save();

    return res.json({
      message: "Cours mis à jour.",

      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};