const SUBSCRIPTION_STATUSES = ["PENDING", "ACTIVE", "EXPIRED", "PAYMENT_FAILED", "CANCELLED", "SUSPENDED"];
function normalizeCountryCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}
function validateCountryCode(value) {
  return /^[A-Z]{2}$/.test(normalizeCountryCode(value));
}
function validateCreateSubscription(payload) {
  const errors = [];
  if (!validateCountryCode(payload.countryCode)) {
    errors.push("countryCode doit être un code ISO de 2 lettres.");
  }
  if (payload.planCode !== undefined && (typeof payload.planCode !== "string" || payload.planCode.trim().length === 0)) {
    errors.push("planCode doit être une chaîne non vide.");
  }
  return errors;
}
function validateActivation(payload) {
  const errors = [];
  if (typeof payload.paymentId !== "string" || payload.paymentId.trim().length === 0) {
    errors.push("paymentId est obligatoire.");
  }
  return errors;
}
function validateAdminStatus(payload) {
  const status = String(payload.status || "").toUpperCase();
  if (!SUBSCRIPTION_STATUSES.includes(status)) {
    return [`status doit être l'un des statuts suivants : ${SUBSCRIPTION_STATUSES.join(", ")}.`];
  }
  return [];
}
module.exports = {
  SUBSCRIPTION_STATUSES,
  normalizeCountryCode,
  validateCountryCode,
  validateCreateSubscription,
  validateActivation,
  validateAdminStatus
};
