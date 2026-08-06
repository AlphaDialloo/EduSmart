import axios from "axios";

const PAYMENT_API_URL =
  import.meta.env.VITE_PAYMENT_API_URL || "http://localhost:3000/api/payments";

const paymentApi = axios.create({
  baseURL: PAYMENT_API_URL,
  timeout: 20000,
});

function getAuthConfig(token) {
  if (!token) {
    throw new Error("Token d’authentification manquant.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

/**
 * Crée un paiement PENDING.
 *
 * Exemple de payload :
 * {
 *   paymentType: "COURSE_PURCHASE",
 *   provider: "TEST",
 *   referenceId: "courseId",
 *   accessPlanId: "planId",
 *   idempotencyKey: "..."
 * }
 */
export async function createPayment(token, payload) {
  const response = await paymentApi.post("/", payload, getAuthConfig(token));

  return response.data;
}

/**
 * Confirme la réussite d’un paiement TEST.
 */
export async function simulatePaymentSuccess(token, paymentId) {
  if (!paymentId) {
    throw new Error("L’identifiant du paiement est obligatoire.");
  }

  const response = await paymentApi.post(
    `/${paymentId}/test-success`,
    {},
    getAuthConfig(token),
  );

  return response.data;
}

/**
 * Simule l’échec d’un paiement TEST.
 */
export async function simulatePaymentFailure(
  token,
  paymentId,
  failureData = {},
) {
  if (!paymentId) {
    throw new Error("L’identifiant du paiement est obligatoire.");
  }

  const response = await paymentApi.post(
    `/${paymentId}/test-failure`,
    {
      failureCode: failureData.failureCode || "TEST_FAILURE",

      failureMessage: failureData.failureMessage || "Paiement de test échoué.",
    },
    getAuthConfig(token),
  );

  return response.data;
}

/**
 * Récupère un paiement appartenant à l’utilisateur connecté.
 */
export async function getPayment(token, paymentId) {
  if (!paymentId) {
    throw new Error("L’identifiant du paiement est obligatoire.");
  }

  const response = await paymentApi.get(`/${paymentId}`, getAuthConfig(token));

  return response.data;
}

/**
 * Récupère l’historique des paiements de l’utilisateur.
 */
export async function getMyPayments(token, params = {}) {
  const response = await paymentApi.get("/me", {
    ...getAuthConfig(token),
    params,
  });

  return response.data;
}

/**
 * Annule un paiement PENDING ou PROCESSING.
 */
export async function cancelPayment(token, paymentId) {
  if (!paymentId) {
    throw new Error("L’identifiant du paiement est obligatoire.");
  }

  const response = await paymentApi.post(
    `/${paymentId}/cancel`,
    {},
    getAuthConfig(token),
  );

  return response.data;
}

export default paymentApi;
