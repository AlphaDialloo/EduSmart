const axios = require("axios");
const client = axios.create({
  baseURL: process.env.SETTINGS_SERVICE_URL,
  timeout: Number(process.env.HTTP_TIMEOUT_MS || 5000)
});
async function getCountryMembershipPricing(countryCode) {
  try {
    const response = await client.get(`/api/settings/countries/${encodeURIComponent(countryCode)}/membership`);
    const pricing = response.data?.countryMembershipSettings;
    if (!pricing) {
      const error = new Error("Le settings-service n'a retourné aucune tarification.");
      error.statusCode = 502;
      throw error;
    }
    return pricing;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    if (error.response?.status === 404) {
      const notFoundError = new Error("Aucun tarif d'adhésion n'est configuré pour ce pays.");
      notFoundError.statusCode = 404;
      throw notFoundError;
    }
    const serviceError = new Error("Impossible de récupérer le tarif d'adhésion.");
    serviceError.statusCode = 502;
    serviceError.cause = error;
    throw serviceError;
  }
}
module.exports = {
  getCountryMembershipPricing
};
