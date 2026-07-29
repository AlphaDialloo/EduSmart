const mongoose = require("mongoose");
const Course = require("../models/Course");

function isAdmin(user) {
  return user?.role === "ADMIN";
}

function canManageCourse(course, user) {
  if (!course || !user) {
    return false;
  }

  return isAdmin(user) || String(course.instructorId) === String(user.id);
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

function sendError(res, error) {
  console.error("Course controller error:", error);

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
    const payload = sanitizeCourseCreationPayload(req.body);

    const course = await Course.create({
      ...payload,
      instructorId: req.user.id,
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
      filter.category = {
        $regex: String(category).trim(),
        $options: "i",
      };
    }

    if (language) {
      filter.language = String(language).trim().toLowerCase();
    }

    if (planType) {
      filter.pricing = filter.pricing || {};
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
    });

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
    const course = await Course.findById(req.params.id);

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

    const courses = await Course.find(filter).sort({
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

    Object.assign(course, allowedData);

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

    const payload = sanitizeResourcePayload(req.body);

    module.resources.push({
      ...payload,
      order: payload.order || module.resources.length + 1,
    });

    await course.save();

    const addedResource = module.resources[module.resources.length - 1];

    return res.status(201).json({
      message: "Ressource ajoutée avec succès.",
      resource: addedResource,
      course,
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

    Object.assign(resource, resourceData);

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

    if (!course.modules.length) {
      return res.status(400).json({
        message:
          "Le cours doit contenir au moins un module avant sa publication.",
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
