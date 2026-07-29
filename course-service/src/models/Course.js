const mongoose = require("mongoose");

const { Schema } = mongoose;

/**
 * Sous-schéma des fonctionnalités d'un plan d'accès.
 */
const planFeaturesSchema = new Schema(
  {
    courseContent: {
      type: Boolean,
      default: true,
    },

    forumAccess: {
      type: Boolean,
      default: false,
    },

    instructorMessaging: {
      type: Boolean,
      default: false,
    },

    personalizedFollowUp: {
      type: Boolean,
      default: false,
    },

    assignmentCorrection: {
      type: Boolean,
      default: false,
    },

    certificateAccess: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  },
);

/**
 * Offre tarifaire d'un cours.
 *
 * Exemples :
 * STANDARD + 1 mois
 * STANDARD + 3 mois
 * PREMIUM + 6 mois
 * PREMIUM + 12 mois
 */
const accessPlanSchema = new Schema(
  {
    planType: {
      type: String,
      enum: ["STANDARD", "PREMIUM"],
      required: true,
    },

    durationMonths: {
      type: Number,
      enum: [1, 3, 6, 12],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    features: {
      type: planFeaturesSchema,
      default: () => ({}),
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Ressource pédagogique consultable dans EduSmart.
 *
 * Aucun contenu n'est destiné à être téléchargé directement.
 * Pour les vidéos, on conserve un identifiant d'asset et non une URL publique.
 */
const resourceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 255,
    },

    description: {
      type: String,
      trim: true,
      default: null,
    },

    type: {
      type: String,
      enum: ["VIDEO", "ARTICLE", "QUIZ", "EXERCISE"],
      required: true,
    },

    /**
     * Identifiant interne de la vidéo.
     * Le backend pourra générer une URL temporaire de streaming.
     */
    videoAssetId: {
      type: String,
      trim: true,
      default: null,
    },

    /**
     * Contenu texte affiché directement dans la plateforme.
     */
    articleContent: {
      type: String,
      default: null,
    },

    durationMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

    order: {
      type: Number,
      min: 1,
      default: 1,
    },

    isPreview: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Module contenant plusieurs ressources.
 */
const moduleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 255,
    },

    description: {
      type: String,
      trim: true,
      default: null,
    },

    order: {
      type: Number,
      min: 1,
      default: 1,
    },

    resources: {
      type: [resourceSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Option proposée dans une question de quiz.
 */
const quizOptionSchema = new Schema(
  {
    text: {
      type: String,
      required: [true, "Le texte de l’option est obligatoire."],
      trim: true,
      minlength: 1,
      maxlength: 500,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  },
);

/**
 * Question d’un quiz.
 */
const quizQuestionSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, "Le texte de la question est obligatoire."],
      trim: true,
      minlength: 2,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"],
      default: "SINGLE_CHOICE",
      required: true,
    },

    options: {
      type: [quizOptionSchema],
      required: true,
      validate: {
        validator(options) {
          return Array.isArray(options) && options.length >= 2;
        },
        message: "Une question doit contenir au moins deux options.",
      },
    },

    points: {
      type: Number,
      min: 1,
      default: 1,
    },

    explanation: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    order: {
      type: Number,
      min: 1,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Validation métier d’une question de quiz.
 */
quizQuestionSchema.pre("validate", function validateQuizQuestion(next) {
  try {
    const options = Array.isArray(this.options) ? this.options : [];
    const correctOptions = options.filter(
      (option) => option.isCorrect === true,
    );

    if (correctOptions.length === 0) {
      return next(
        new Error(
          `La question "${this.question}" doit contenir au moins une bonne réponse.`,
        ),
      );
    }

    if (
      ["SINGLE_CHOICE", "TRUE_FALSE"].includes(this.type) &&
      correctOptions.length !== 1
    ) {
      return next(
        new Error(
          `Une question de type ${this.type} doit avoir exactement une bonne réponse.`,
        ),
      );
    }

    if (this.type === "TRUE_FALSE" && options.length !== 2) {
      return next(
        new Error(
          "Une question de type TRUE_FALSE doit contenir exactement deux options.",
        ),
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Quiz associé à un module du cours.
 */
const quizSchema = new Schema(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      required: [true, "Le module du quiz est obligatoire."],
    },

    title: {
      type: String,
      required: [true, "Le titre du quiz est obligatoire."],
      trim: true,
      minlength: 2,
      maxlength: 255,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },

    timeLimitMinutes: {
      type: Number,
      min: 1,
      default: null,
    },

    maxAttempts: {
      type: Number,
      min: 1,
      max: 20,
      default: 3,
    },

    questions: {
      type: [quizQuestionSchema],
      required: true,
      validate: {
        validator(questions) {
          return Array.isArray(questions) && questions.length > 0;
        },
        message: "Le quiz doit contenir au moins une question.",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Modèle principal d'un cours.
 */
const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 255,
    },

    description: {
      type: String,
      trim: true,
      default: null,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    level: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
      default: "BEGINNER",
    },

    language: {
      type: String,
      trim: true,
      lowercase: true,
      default: "fr",
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) => {
        if (!Array.isArray(tags)) {
          return [];
        }

        return [
          ...new Set(
            tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean),
          ),
        ];
      },
    },

    instructorId: {
      type: String,
      required: true,
      trim: true,
    },

    thumbnailAssetId: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },

    modules: {
      type: [moduleSchema],
      default: [],
    },

    quizzes: {
      type: [quizSchema],
      default: [],
    },

    pricing: {
      isFree: {
        type: Boolean,
        default: false,
      },

      /**
       * Devise de référence du cours.
       * La conversion est faite côté backend selon le pays de l'apprenant.
       */
      baseCurrency: {
        type: String,
        required: true,
        default: "XAF",
        uppercase: true,
        trim: true,
        minlength: 3,
        maxlength: 10,
      },

      platformCommissionRate: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },

      accessPlans: {
        type: [accessPlanSchema],
        default: [],
      },
    },

    /**
     * Cache MongoDB du sponsoring.
     * PostgreSQL reste la source de vérité.
     */
    sponsorship: {
      isSponsored: {
        type: Boolean,
        default: false,
      },

      priorityLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 10,
      },

      startsAt: {
        type: Date,
        default: null,
      },

      endsAt: {
        type: Date,
        default: null,
      },

      sponsorshipId: {
        type: String,
        trim: true,
        default: null,
      },
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/**
 * Validation métier des ressources.
 */
resourceSchema.pre("validate", function validateResource(next) {
  if (this.type === "VIDEO" && !this.videoAssetId) {
    return next(
      new Error("Une ressource VIDEO doit contenir un champ videoAssetId."),
    );
  }

  if (this.type === "ARTICLE" && !this.articleContent) {
    return next(
      new Error("Une ressource ARTICLE doit contenir un champ articleContent."),
    );
  }

  if (this.type !== "VIDEO") {
    this.videoAssetId = null;
  }

  if (this.type !== "ARTICLE") {
    this.articleContent = null;
  }

  next();
});

/**
 * Validation métier globale du cours.
 */
courseSchema.pre("validate", function validateCourse(next) {
  try {
    const pricing = this.pricing || {};
    const accessPlans = pricing.accessPlans || [];

    if (pricing.isFree) {
      for (const accessPlan of accessPlans) {
        if (Number(accessPlan.price) !== 0) {
          return next(
            new Error(
              "Tous les prix doivent être égaux à 0 lorsque le cours est gratuit.",
            ),
          );
        }
      }
    } else if (accessPlans.length === 0) {
      return next(
        new Error(
          "Un cours payant doit contenir au moins une offre tarifaire.",
        ),
      );
    }

    const planCombinations = new Set();

    for (const accessPlan of accessPlans) {
      const key = `${accessPlan.planType}-${accessPlan.durationMonths}`;

      if (planCombinations.has(key)) {
        return next(
          new Error(
            `Le plan ${accessPlan.planType} de ${accessPlan.durationMonths} mois existe déjà.`,
          ),
        );
      }

      planCombinations.add(key);

      if (accessPlan.planType === "STANDARD") {
        accessPlan.features.courseContent = true;
        accessPlan.features.forumAccess = false;
        accessPlan.features.instructorMessaging = false;
        accessPlan.features.personalizedFollowUp = false;
        accessPlan.features.assignmentCorrection = false;
      }

      if (accessPlan.planType === "PREMIUM") {
        accessPlan.features.courseContent = true;
        accessPlan.features.forumAccess = true;
        accessPlan.features.instructorMessaging = true;
        accessPlan.features.personalizedFollowUp = true;
        accessPlan.features.assignmentCorrection = true;
      }
    }

    const sponsorship = this.sponsorship || {};

    if (
      sponsorship.isSponsored &&
      (!sponsorship.startsAt ||
        !sponsorship.endsAt ||
        !sponsorship.sponsorshipId)
    ) {
      return next(
        new Error(
          "Un cours sponsorisé doit avoir un identifiant, une date de début et une date de fin.",
        ),
      );
    }

    if (
      sponsorship.startsAt &&
      sponsorship.endsAt &&
      sponsorship.endsAt <= sponsorship.startsAt
    ) {
      return next(
        new Error(
          "La date de fin du sponsoring doit être postérieure à la date de début.",
        ),
      );
    }

    if (!sponsorship.isSponsored) {
      sponsorship.priorityLevel = 0;
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Gestion automatique des dates selon le statut.
 */
courseSchema.pre("save", function updateStatusDates(next) {
  if (!this.isModified("status")) {
    return next();
  }

  if (this.status === "PUBLISHED") {
    this.publishedAt = this.publishedAt || new Date();
    this.archivedAt = null;
  }

  if (this.status === "ARCHIVED") {
    this.archivedAt = new Date();
  }

  if (this.status === "DRAFT") {
    this.archivedAt = null;
  }

  next();
});

/**
 * Retourne l'offre active correspondant au type et à la durée.
 */
courseSchema.methods.getAccessPlan = function getAccessPlan(
  planType,
  durationMonths,
) {
  const normalizedPlanType = String(planType).toUpperCase();
  const normalizedDuration = Number(durationMonths);

  return this.pricing.accessPlans.find(
    (accessPlan) =>
      accessPlan.isActive &&
      accessPlan.planType === normalizedPlanType &&
      accessPlan.durationMonths === normalizedDuration,
  );
};

/**
 * Vérifie si le sponsoring est actif à la date actuelle.
 */
courseSchema.methods.hasActiveSponsorship = function hasActiveSponsorship() {
  const now = new Date();
  const sponsorship = this.sponsorship;

  return Boolean(
    sponsorship?.isSponsored &&
    sponsorship.startsAt &&
    sponsorship.endsAt &&
    sponsorship.startsAt <= now &&
    sponsorship.endsAt > now,
  );
};

/**
 * Nettoie le cache de sponsoring expiré.
 */
courseSchema.methods.clearExpiredSponsorship =
  function clearExpiredSponsorship() {
    const sponsorship = this.sponsorship;

    if (
      sponsorship?.isSponsored &&
      sponsorship.endsAt &&
      sponsorship.endsAt <= new Date()
    ) {
      sponsorship.isSponsored = false;
      sponsorship.priorityLevel = 0;
      sponsorship.startsAt = null;
      sponsorship.endsAt = null;
      sponsorship.sponsorshipId = null;
    }

    return this;
  };

/**
 * Retourne les modules et ressources actifs dans le bon ordre.
 */
courseSchema.methods.getOrderedContent = function getOrderedContent() {
  return this.modules
    .filter((module) => module.isActive)
    .sort((firstModule, secondModule) => {
      return firstModule.order - secondModule.order;
    })
    .map((module) => ({
      ...module.toObject(),
      resources: module.resources
        .filter((resource) => resource.isActive)
        .sort((firstResource, secondResource) => {
          return firstResource.order - secondResource.order;
        }),
    }));
};

/**
 * Index de recherche et de tri.
 */
courseSchema.index({
  title: "text",
  description: "text",
  category: "text",
  tags: "text",
});

courseSchema.index({
  status: 1,
  isActive: 1,
});

courseSchema.index({
  instructorId: 1,
  status: 1,
});

courseSchema.index({
  category: 1,
  level: 1,
  language: 1,
});

courseSchema.index({
  "pricing.accessPlans.planType": 1,
  "pricing.accessPlans.durationMonths": 1,
});

courseSchema.index({
  "sponsorship.isSponsored": -1,
  "sponsorship.priorityLevel": -1,
  "sponsorship.endsAt": 1,
});

module.exports = mongoose.model("Course", courseSchema);
