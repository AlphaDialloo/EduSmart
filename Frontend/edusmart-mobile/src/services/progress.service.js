import api, { authConfig } from "./api";
export async function getMyEnrollments(token) {
  const response = await api.get("/progress/enrollments/me", authConfig(token));
  return response.data;
}
export async function ensureProgressEnrollment(token, courseId, courseTitle) {
  const response = await api.post("/progress/enrollments", {
    courseId,
    courseTitle
  }, authConfig(token));
  return response.data;
}
export async function getEnrollmentProgress(token, enrollmentId) {
  const response = await api.get(`/progress/enrollments/${enrollmentId}/progress`, authConfig(token));
  return response.data;
}
export async function getLearningReflections(token, enrollmentId) {
  const response = await api.get(`/progress/enrollments/${enrollmentId}/reflections`, authConfig(token));
  return response.data;
}
export async function saveLearningReflection(token, enrollmentId, moduleId, payload) {
  const response = await api.put(`/progress/enrollments/${enrollmentId}/reflections/${moduleId}`, payload, authConfig(token));
  return response.data;
}
export async function saveResourceProgress(token, payload) {
  const response = await api.post("/progress/resources/progress", payload, authConfig(token));
  return response.data;
}
