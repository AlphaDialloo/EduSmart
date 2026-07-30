const repo = require("../repositories/payment.repository");
const subscriptions = require("../services/subscription.service");
const courses = require("../services/course.service");
const provider = require("../services/provider.service");

const {
  validateCreatePayment,
  validateRefund,
} = require("../utils/validators");

const page = (query) => ({
  page: Math.max(parseInt(query.page, 10) || 1, 1),
  limit: Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100),
});

/**
 * Récupère les informations nécessaires à la création du paiement.
 */
async function details(type, referenceId, userId, accessPlanId) {
  if (type === "INSTRUCTOR_MEMBERSHIP") {
    const subscription = await subscriptions.getSubscription(referenceId);

    if (String(subscription.instructorId) !== String(userId)) {
      const error = new Error(
        "Cette adhésion n'appartient pas à l'utilisateur.",
      );
      error.statusCode = 403;
      throw error;
    }

    if (subscription.status !== "PENDING") {
      const error = new Error(
        "Seules les adhésions PENDING peuvent être payées.",
      );
      error.statusCode = 409;
      throw error;
    }

    return {
      countryCode: subscription.countryCode,
      currency: subscription.currency,
      amount: subscription.amount,
      metadata: {
        subscriptionId: subscription.id,
        planCode: subscription.planCode,
      },
    };
  }

  if (type === "COURSE_PURCHASE") {
    if (!accessPlanId) {
      const error = new Error("L'identifiant du plan d'accès est obligatoire.");
      error.statusCode = 400;
      throw error;
    }

    const course = await courses.getCourseForPayment(referenceId, accessPlanId);

    console.log("Détails du cours reçus par payment-service :", course);

    if (
      !course.courseId ||
      !course.instructorId ||
      course.amount === undefined ||
      course.amount === null ||
      !course.currency ||
      !course.accessPlanId
    ) {
      const error = new Error(
        "Les informations de paiement du cours sont incomplètes.",
      );
      error.statusCode = 502;
      throw error;
    }

    return {
      countryCode: course.countryCode,
      currency: course.currency,
      amount: Number(course.amount),
      metadata: {
        courseId: course.courseId,
        instructorId: course.instructorId,
        courseTitle: course.title,
        accessPlanId: course.accessPlanId,
        planType: course.planType,
        durationMonths: course.durationMonths,
        commissionRate: course.commissionRate,
      },
    };
  }

  const error = new Error("Type de paiement non pris en charge.");
  error.statusCode = 400;
  throw error;
}

/**
 * Créer un paiement.
 */
exports.create = async (req, res, next) => {
  try {
    const validation = validateCreatePayment(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: "Données invalides.",
        errors: validation.errors,
      });
    }

    const paymentDetails = await details(
      validation.value.paymentType,
      validation.value.referenceId,
      req.user.id,
      validation.value.accessPlanId,
    );

    const result = await repo.createPayment({
      userId: req.user.id,
      ...validation.value,
      ...paymentDetails,
    });

    if (!result.created) {
      return res.status(200).json({
        message: "Paiement déjà créé pour cette clé d'idempotence.",
        payment: result.payment,
        created: false,
      });
    }

    const intent = await provider.createPaymentIntent({
      provider: validation.value.provider,
      payment: result.payment,
    });

    const payment = await repo.setProviderPayment(
      result.payment.id,
      intent.providerPaymentId,
      intent.metadata,
    );

    return res.status(201).json({
      message: "Paiement créé.",
      payment,
      provider: {
        checkoutUrl: intent.checkoutUrl,
        clientSecret: intent.clientSecret,
      },
      created: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer les paiements de l'utilisateur connecté.
 */
exports.getMine = async (req, res, next) => {
  try {
    const pagination = page(req.query);

    const result = await repo.listForUser(req.user.id, pagination);

    return res.json({
      ...result,
      ...pagination,
      totalPages: Math.ceil(result.total / pagination.limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un paiement appartenant à l'utilisateur.
 */
exports.getOne = async (req, res, next) => {
  try {
    const payment = await repo.findByIdForUser(req.params.id, req.user.id);

    if (!payment) {
      return res.status(404).json({
        message: "Paiement introuvable.",
      });
    }

    const events = await repo.listEvents(payment.id);

    return res.json({
      payment,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Annuler un paiement.
 */
exports.cancel = async (req, res, next) => {
  try {
    const existingPayment = await repo.findByIdForUser(
      req.params.id,
      req.user.id,
    );

    if (!existingPayment) {
      return res.status(404).json({
        message: "Paiement introuvable.",
      });
    }

    const payment = await repo.transitionStatus({
      paymentId: existingPayment.id,
      allowedStatuses: ["PENDING", "PROCESSING"],
      newStatus: "CANCELLED",
      eventType: "CANCELLED",
      message: "Paiement annulé par l'utilisateur.",
      cancelledAt: new Date(),
    });

    return res.json({
      message: "Paiement annulé.",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Simuler la réussite d'un paiement TEST.
 */
exports.testSuccess = async (req, res, next) => {
  try {
    const existingPayment = await repo.findById(req.params.id);

    if (!existingPayment) {
      return res.status(404).json({
        message: "Paiement introuvable.",
      });
    }

    if (existingPayment.provider !== "TEST") {
      return res.status(409).json({
        message: "Route réservée aux paiements TEST.",
      });
    }

    const payment = await repo.transitionStatus({
      paymentId: existingPayment.id,
      allowedStatuses: ["PENDING", "PROCESSING"],
      newStatus: "SUCCEEDED",
      eventType: "SUCCEEDED",
      message: "Paiement de test réussi.",
      paidAt: new Date(),
      payload: {
        simulated: true,
      },
    });

    if (payment.paymentType === "INSTRUCTOR_MEMBERSHIP") {
      await subscriptions.activateSubscription(payment.referenceId, payment.id);
    }

    if (payment.paymentType === "COURSE_PURCHASE") {
      const accessPlanId = payment.metadata?.accessPlanId;

      if (!accessPlanId) {
        const error = new Error(
          "Le plan d'accès est absent des métadonnées du paiement.",
        );
        error.statusCode = 500;
        throw error;
      }

      await courses.grantCourseAccess({
        courseId: payment.referenceId,
        studentId: payment.userId,
        paymentId: payment.id,
        accessPlanId,
      });

      await repo.markCourseAccessGranted(payment.id);
    }

    return res.json({
      message: "Paiement de test confirmé.",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Simuler l'échec d'un paiement TEST.
 */
exports.testFailure = async (req, res, next) => {
  try {
    const existingPayment = await repo.findById(req.params.id);

    if (!existingPayment) {
      return res.status(404).json({
        message: "Paiement introuvable.",
      });
    }

    if (existingPayment.provider !== "TEST") {
      return res.status(409).json({
        message: "Route réservée aux paiements TEST.",
      });
    }

    const failureCode = String(req.body.failureCode || "TEST_FAILURE");

    const failureMessage = String(
      req.body.failureMessage || "Paiement de test échoué.",
    );

    const payment = await repo.transitionStatus({
      paymentId: existingPayment.id,
      allowedStatuses: ["PENDING", "PROCESSING"],
      newStatus: "FAILED",
      eventType: "FAILED",
      message: failureMessage,
      failureCode,
      failureMessage,
      payload: {
        simulated: true,
      },
    });

    if (payment.paymentType === "INSTRUCTOR_MEMBERSHIP") {
      await subscriptions.markSubscriptionPaymentFailed(
        payment.referenceId,
        failureCode,
        failureMessage,
      );
    }

    return res.json({
      message: "Échec simulé.",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Liste administrative des paiements.
 */
exports.adminList = async (req, res, next) => {
  try {
    const pagination = page(req.query);

    const result = await repo.listAll({
      ...pagination,
      status: req.query.status,
      paymentType: req.query.paymentType,
    });

    return res.json({
      ...result,
      ...pagination,
      totalPages: Math.ceil(result.total / pagination.limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un paiement pour l'administration.
 */
exports.adminGetOne = async (req, res, next) => {
  try {
    const payment = await repo.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: "Paiement introuvable.",
      });
    }

    const events = await repo.listEvents(payment.id);

    return res.json({
      payment,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rembourser un paiement.
 */
exports.refund = async (req, res, next) => {
  try {
    const payment = await repo.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: "Paiement introuvable.",
      });
    }

    if (!["SUCCEEDED", "PARTIALLY_REFUNDED"].includes(payment.status)) {
      return res.status(409).json({
        message: "Ce paiement ne peut pas être remboursé.",
      });
    }

    const validation = validateRefund(req.body, payment);

    if (!validation.valid) {
      return res.status(400).json({
        message: "Données invalides.",
        errors: validation.errors,
      });
    }

    const providerRefund = await provider.refundPayment({
      provider: payment.provider,
      payment,
      amount: validation.value.amount,
    });

    const result = await repo.createRefund({
      payment,
      requestedBy: req.user.id,
      amount: validation.value.amount,
      reason: validation.value.reason,
      providerRefundId: providerRefund.providerRefundId,
      status: providerRefund.status,
    });

    return res.json({
      message: "Remboursement traité.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
