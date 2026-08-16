const repository = require("../repositories/subscription.repository");
const settingsService = require("../services/settings.service");
const {
  SUBSCRIPTION_STATUSES,
  normalizeCountryCode,
  validateCreateSubscription,
  validateActivation,
  validateAdminStatus
} = require("../utils/validators");
function sendError(res, error) {
  console.error("subscription-service:", error);
  if (error.code === "23505") {
    return res.status(409).json({
      message: "Cette opération existe déjà."
    });
  }
  return res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Erreur serveur."
  });
}
async function createPendingSubscription(req, res, eventName) {
  try {
    const errors = validateCreateSubscription(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Données invalides.",
        errors
      });
    }
    const countryCode = normalizeCountryCode(req.body.countryCode);
    const planCode = String(req.body.planCode || "INSTRUCTOR_ANNUAL").toUpperCase();
    const [plan, pricing] = await Promise.all([repository.getPlanByCode(planCode), settingsService.getCountryMembershipPricing(countryCode)]);
    if (!plan) {
      return res.status(404).json({
        message: "Plan d'adhésion introuvable."
      });
    }
    if (!pricing.enabled) {
      return res.status(409).json({
        message: "Les adhésions de formateurs sont désactivées dans ce pays."
      });
    }
    const result = await repository.createSubscription({
      instructorId: req.user.id,
      planId: plan.id,
      countryCode,
      currency: pricing.currency,
      amount: pricing.annualInstructorFee,
      autoRenew: Boolean(req.body.autoRenew)
    });
    return res.status(result.created ? 201 : 200).json({
      message: result.created ? `${eventName} créée. Le paiement doit maintenant être traité.` : "Une demande de paiement est déjà en attente.",
      subscription: result.subscription,
      paymentRequired: true
    });
  } catch (error) {
    return sendError(res, error);
  }
}
exports.createSubscription = (req, res) => createPendingSubscription(req, res, "Demande d'adhésion");
exports.renewSubscription = (req, res) => createPendingSubscription(req, res, "Demande de renouvellement");
exports.getMe = async (req, res) => {
  try {
    const subscriptions = await repository.getMySubscriptions(req.user.id);
    const current = await repository.getCurrentActive(req.user.id);
    return res.status(200).json({
      current,
      subscriptions
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.getMyStatus = async (req, res) => {
  try {
    const subscription = await repository.getCurrentActive(req.user.id);
    if (!subscription) {
      return res.status(200).json({
        active: false,
        reason: "NO_ACTIVE_SUBSCRIPTION",
        subscription: null
      });
    }
    const remainingMilliseconds = new Date(subscription.expiresAt).getTime() - Date.now();
    return res.status(200).json({
      active: true,
      expiresAt: subscription.expiresAt,
      remainingDays: Math.max(0, Math.ceil(remainingMilliseconds / 86_400_000)),
      subscription
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.cancelPending = async (req, res) => {
  try {
    const subscription = await repository.cancelPending(req.params.id, req.user.id);
    if (!subscription) {
      return res.status(404).json({
        message: "Adhésion introuvable."
      });
    }
    return res.status(200).json({
      message: "Demande d'adhésion annulée.",
      subscription
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.checkInstructorActive = async (req, res) => {
  try {
    const subscription = await repository.getCurrentActive(req.params.instructorId);
    return res.status(200).json(subscription ? {
      active: true,
      subscription
    } : {
      active: false,
      reason: "NO_ACTIVE_SUBSCRIPTION"
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.activate = async (req, res) => {
  try {
    const errors = validateActivation(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Données invalides.",
        errors
      });
    }
    const subscription = await repository.activateSubscription(req.params.id, req.body.paymentId.trim(), req.body.actorId || null);
    if (!subscription) {
      return res.status(404).json({
        message: "Adhésion introuvable."
      });
    }
    return res.status(200).json({
      message: "Adhésion activée avec succès.",
      subscription
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.paymentFailed = async (req, res) => {
  try {
    const subscription = await repository.markPaymentFailed(req.params.id, req.body.paymentId || null, req.body.reason || null, req.body.actorId || null);
    if (!subscription) {
      return res.status(404).json({
        message: "Adhésion introuvable."
      });
    }
    return res.status(200).json({
      message: "Échec de paiement enregistré.",
      subscription
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.listAdmin = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    if (status && !SUBSCRIPTION_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Filtre status invalide."
      });
    }
    const result = await repository.listSubscriptions({
      page,
      limit,
      status,
      instructorId: req.query.instructorId,
      countryCode: req.query.countryCode ? normalizeCountryCode(req.query.countryCode) : undefined
    });
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
};
exports.getAdminById = async (req, res) => {
  try {
    const [subscription, history] = await Promise.all([repository.getSubscriptionById(req.params.id), repository.getHistory(req.params.id)]);
    if (!subscription) {
      return res.status(404).json({
        message: "Adhésion introuvable."
      });
    }
    return res.status(200).json({
      subscription,
      history
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.updateAdminStatus = async (req, res) => {
  try {
    const errors = validateAdminStatus(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Données invalides.",
        errors
      });
    }
    const subscription = await repository.updateAdminStatus(req.params.id, String(req.body.status).toUpperCase(), req.user.id, req.body.reason || null);
    if (!subscription) {
      return res.status(404).json({
        message: "Adhésion introuvable."
      });
    }
    return res.status(200).json({
      message: "Statut mis à jour.",
      subscription
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.expireElapsed = async (_req, res) => {
  try {
    const expiredCount = await repository.expireElapsedSubscriptions();
    return res.status(200).json({
      expiredCount
    });
  } catch (error) {
    return sendError(res, error);
  }
};
exports.getInternalById = async (req, res) => {
  try {
    const subscription = await repository.getSubscriptionById(req.params.id);
    if (!subscription) {
      return res.status(404).json({
        message: "Adhésion introuvable."
      });
    }
    return res.status(200).json({
      subscription
    });
  } catch (error) {
    return sendError(res, error);
  }
};
