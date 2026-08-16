const SUPPORTED_CURRENCIES = ["CAD", "USD", "EUR", "XAF"];
const SUPPORTED_LANGUAGES = ["fr", "en"];
const SUPPORTED_THEMES = ["light", "dark", "system"];
function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function validatePlatformSettings(payload) {
  const errors = [];
  if ("platformName" in payload) {
    if (typeof payload.platformName !== "string" || payload.platformName.trim().length < 2 || payload.platformName.trim().length > 100) {
      errors.push("platformName doit contenir entre 2 et 100 caractères.");
    }
  }
  if ("supportEmail" in payload) {
    const email = String(payload.supportEmail || "").trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validEmail) {
      errors.push("supportEmail doit être une adresse valide.");
    }
  }
  if ("defaultLanguage" in payload) {
    if (!SUPPORTED_LANGUAGES.includes(payload.defaultLanguage)) {
      errors.push(`defaultLanguage doit être l'une des valeurs suivantes : ${SUPPORTED_LANGUAGES.join(", ")}.`);
    }
  }
  if ("supportedLanguages" in payload) {
    if (!Array.isArray(payload.supportedLanguages) || payload.supportedLanguages.length === 0 || payload.supportedLanguages.some(language => !SUPPORTED_LANGUAGES.includes(language))) {
      errors.push(`supportedLanguages doit être un tableau non vide contenant uniquement : ${SUPPORTED_LANGUAGES.join(", ")}.`);
    }
  }
  if ("currency" in payload) {
    if (!SUPPORTED_CURRENCIES.includes(payload.currency)) {
      errors.push(`currency doit être l'une des valeurs suivantes : ${SUPPORTED_CURRENCIES.join(", ")}.`);
    }
  }
  if ("timezone" in payload) {
    if (typeof payload.timezone !== "string" || payload.timezone.trim().length < 3 || payload.timezone.trim().length > 100) {
      errors.push("timezone est invalide.");
    }
  }
  if ("defaultTheme" in payload) {
    if (!SUPPORTED_THEMES.includes(payload.defaultTheme)) {
      errors.push(`defaultTheme doit être l'une des valeurs suivantes : ${SUPPORTED_THEMES.join(", ")}.`);
    }
  }
  if ("maintenanceMode" in payload) {
    if (typeof payload.maintenanceMode !== "boolean") {
      errors.push("maintenanceMode doit être un booléen.");
    }
  }
  if ("allowRegistrations" in payload) {
    if (typeof payload.allowRegistrations !== "boolean") {
      errors.push("allowRegistrations doit être un booléen.");
    }
  }
  if ("certificateEnabled" in payload) {
    if (typeof payload.certificateEnabled !== "boolean") {
      errors.push("certificateEnabled doit être un booléen.");
    }
  }
  if ("recommendationEnabled" in payload) {
    if (typeof payload.recommendationEnabled !== "boolean") {
      errors.push("recommendationEnabled doit être un booléen.");
    }
  }
  if ("metadata" in payload && !isPlainObject(payload.metadata)) {
    errors.push("metadata doit être un objet JSON.");
  }
  return errors;
}
function validateFeatureFlag(payload, partial = false) {
  const errors = [];
  if (!partial || "key" in payload) {
    if (typeof payload.key !== "string" || !/^[a-z0-9._-]{2,100}$/.test(payload.key)) {
      errors.push("key doit contenir entre 2 et 100 caractères minuscules, chiffres, points, tirets ou underscores.");
    }
  }
  if (!partial || "name" in payload) {
    if (typeof payload.name !== "string" || payload.name.trim().length < 2 || payload.name.trim().length > 150) {
      errors.push("name doit contenir entre 2 et 150 caractères.");
    }
  }
  if ("enabled" in payload && typeof payload.enabled !== "boolean") {
    errors.push("enabled doit être un booléen.");
  }
  if ("description" in payload && payload.description !== null && (typeof payload.description !== "string" || payload.description.length > 1000)) {
    errors.push("description doit être une chaîne de 1000 caractères maximum.");
  }
  if ("configuration" in payload && !isPlainObject(payload.configuration)) {
    errors.push("configuration doit être un objet JSON.");
  }
  return errors;
}
function validateCountryMembershipSettings(payload, partial = false) {
  const errors = [];
  if (!partial || "countryCode" in payload) {
    if (typeof payload.countryCode !== "string" || !/^[A-Za-z]{2}$/.test(payload.countryCode.trim())) {
      errors.push("countryCode doit être un code ISO de 2 lettres.");
    }
  }
  if (!partial || "countryName" in payload) {
    if (typeof payload.countryName !== "string" || payload.countryName.trim().length < 2 || payload.countryName.trim().length > 100) {
      errors.push("countryName doit contenir entre 2 et 100 caractères.");
    }
  }
  if (!partial || "currency" in payload) {
    if (typeof payload.currency !== "string" || !/^[A-Za-z]{3}$/.test(payload.currency.trim())) {
      errors.push("currency doit être un code ISO de 3 lettres.");
    }
  }
  if (!partial || "annualInstructorFee" in payload) {
    const amount = Number(payload.annualInstructorFee);
    if (!Number.isFinite(amount) || amount < 0) {
      errors.push("annualInstructorFee doit être un nombre supérieur ou égal à 0.");
    }
  }
  if ("enabled" in payload && typeof payload.enabled !== "boolean") {
    errors.push("enabled doit être un booléen.");
  }
  return errors;
}
module.exports = {
  validatePlatformSettings,
  validateFeatureFlag,
  validateCountryMembershipSettings
};
