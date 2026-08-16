const {
  v4: uuidv4
} = require("uuid");
async function createPaymentIntent({
  provider,
  payment
}) {
  if (provider !== "TEST") {
    const e = new Error(`Le fournisseur ${provider} n'est pas encore implémenté.`);
    e.statusCode = 501;
    throw e;
  }
  return {
    providerPaymentId: `test_${uuidv4()}`,
    checkoutUrl: null,
    clientSecret: null,
    metadata: {
      simulated: true,
      paymentId: payment.id
    }
  };
}
async function refundPayment({
  provider,
  payment,
  amount
}) {
  if (provider !== "TEST") {
    const e = new Error(`Le remboursement ${provider} n'est pas encore implémenté.`);
    e.statusCode = 501;
    throw e;
  }
  return {
    providerRefundId: `test_refund_${uuidv4()}`,
    status: "SUCCEEDED",
    amount,
    paymentId: payment.id
  };
}
module.exports = {
  createPaymentIntent,
  refundPayment
};
