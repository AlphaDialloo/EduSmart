import axios from "axios";
const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL || "http://localhost:3000/api/payments";
const paymentApi = axios.create({
  baseURL: PAYMENT_API_URL,
  timeout: 20000
});
function getAuthConfig(token) {
  if (!token) {
    throw new Error("Token d’authentification manquant.");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  };
}
export async function createPayment(token, payload) {
  const response = await paymentApi.post("/", payload, getAuthConfig(token));
  return response.data;
}
export async function simulatePaymentSuccess(token, paymentId) {
  if (!paymentId) {
    throw new Error("L’identifiant du paiement est obligatoire.");
  }
  const response = await paymentApi.post(`/${paymentId}/test-success`, {}, getAuthConfig(token));
  return response.data;
}
export async function simulatePaymentFailure(token, paymentId, failureData = {}) {
  if (!paymentId) {
    throw new Error("L’identifiant du paiement est obligatoire.");
  }
  const response = await paymentApi.post(`/${paymentId}/test-failure`, {
    failureCode: failureData.failureCode || "TEST_FAILURE",
    failureMessage: failureData.failureMessage || "Paiement de test échoué."
  }, getAuthConfig(token));
  return response.data;
}
export async function getPayment(token, paymentId) {
  if (!paymentId) {
    throw new Error("L’identifiant du paiement est obligatoire.");
  }
  const response = await paymentApi.get(`/${paymentId}`, getAuthConfig(token));
  return response.data;
}
export async function getMyPayments(token, params = {}) {
  const response = await paymentApi.get("/me", {
    ...getAuthConfig(token),
    params
  });
  return response.data;
}
export async function cancelPayment(token, paymentId) {
  if (!paymentId) {
    throw new Error("L’identifiant du paiement est obligatoire.");
  }
  const response = await paymentApi.post(`/${paymentId}/cancel`, {}, getAuthConfig(token));
  return response.data;
}
export default paymentApi;
