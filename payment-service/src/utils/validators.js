const { validate: validateUuid } = require("uuid");

const TYPES = ["INSTRUCTOR_MEMBERSHIP", "COURSE_PURCHASE"];

const PROVIDERS = ["TEST", "STRIPE", "PAYPAL", "ORANGE_MONEY", "MTN_MOMO"];

const MONGO_OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

function isMongoObjectId(value) {
  return MONGO_OBJECT_ID_REGEX.test(value);
}

function create(body = {}) {
  const paymentType = String(body.paymentType || "").toUpperCase();

  const provider = String(body.provider || "TEST").toUpperCase();

  const referenceId = String(body.referenceId || "").trim();

  const accessPlanId = body.accessPlanId
    ? String(body.accessPlanId).trim()
    : null;

  const idempotencyKey = body.idempotencyKey
    ? String(body.idempotencyKey).trim()
    : null;

  const errors = [];

  if (!TYPES.includes(paymentType)) {
    errors.push("Type de paiement invalide.");
  }

  if (!PROVIDERS.includes(provider)) {
    errors.push("Fournisseur invalide.");
  }

  if (paymentType === "INSTRUCTOR_MEMBERSHIP") {
    if (!validateUuid(referenceId)) {
      errors.push(
        "referenceId doit être un UUID valide pour une adhésion formateur.",
      );
    }

    if (accessPlanId) {
      errors.push(
        "accessPlanId ne doit pas être fourni pour une adhésion formateur.",
      );
    }
  }

  if (paymentType === "COURSE_PURCHASE") {
    if (!isMongoObjectId(referenceId)) {
      errors.push(
        "referenceId doit être un ObjectId MongoDB valide pour l'achat d'un cours.",
      );
    }

    if (!accessPlanId) {
      errors.push("accessPlanId est obligatoire pour l'achat d'un cours.");
    } else if (!isMongoObjectId(accessPlanId)) {
      errors.push("accessPlanId doit être un ObjectId MongoDB valide.");
    }
  }

  if (idempotencyKey && idempotencyKey.length > 255) {
    errors.push("La clé d'idempotence ne doit pas dépasser 255 caractères.");
  }

  return {
    valid: errors.length === 0,
    errors,
    value: {
      paymentType,
      provider,
      referenceId,
      accessPlanId,
      idempotencyKey,
    },
  };
}

function refund(body = {}, payment) {
  const amount = Number(body.amount);

  const remaining =
    Number(payment.amount) - Number(payment.refundedAmount || 0);

  const errors = [];

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Montant invalide.");
  }

  if (Number.isFinite(amount) && amount > remaining) {
    errors.push("Le montant dépasse le solde remboursable.");
  }

  return {
    valid: errors.length === 0,
    errors,
    value: {
      amount,
      reason: body.reason ? String(body.reason).trim() : null,
    },
  };
}

module.exports = {
  validateCreatePayment: create,
  validateRefund: refund,
};
