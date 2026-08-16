import api, { authConfig } from "./api";

export async function createCoursePayment(token, courseId, accessPlanId, userId) {
  const response = await api.post("/payments", {
    paymentType: "COURSE_PURCHASE",
    provider: "TEST",
    referenceId: courseId,
    accessPlanId,
    idempotencyKey: ["mobile", userId || "student", courseId, accessPlanId, Date.now()].join("-")
  }, authConfig(token));
  return response.data;
}

export async function confirmTestPayment(token, paymentId) {
  const response = await api.post(`/payments/${paymentId}/test-success`, {}, authConfig(token));
  return response.data;
}
