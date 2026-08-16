const axios = require("axios");
const client = axios.create({
  baseURL: process.env.SUBSCRIPTION_SERVICE_URL,
  timeout: 10000
});
const headers = () => ({
  "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET
});
async function getSubscription(id) {
  const response = await client.get(`/api/subscriptions/internal/${id}`, {
    headers: headers()
  });
  return response.data.subscription || response.data;
}
async function activateSubscription(id, paymentId) {
  const response = await client.post(`/api/subscriptions/internal/${id}/activate`, {
    paymentId
  }, {
    headers: headers()
  });
  return response.data;
}
async function markSubscriptionPaymentFailed(id, failureCode, failureMessage) {
  const response = await client.post(`/api/subscriptions/internal/${id}/payment-failed`, {
    reason: failureMessage || failureCode
  }, {
    headers: headers()
  });
  return response.data;
}
module.exports = {
  getSubscription,
  activateSubscription,
  markSubscriptionPaymentFailed
};
