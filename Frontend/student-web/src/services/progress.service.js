import axios from "axios";
import { getApiUrl } from "./apiUrl";
const PROGRESS_API_URL = import.meta.env.VITE_PROGRESS_API_URL || getApiUrl("progress");
const progressApi = axios.create({
  baseURL: PROGRESS_API_URL,
  timeout: 15000
});
function getAuthConfig(token) {
  if (!token) {
    throw new Error("Token d'authentification manquant.");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  };
}
export async function getStudentDashboard(token) {
  const response = await progressApi.get("/dashboard", getAuthConfig(token));
  return response.data;
}
export async function getMyEnrollments(token) {
  const response = await progressApi.get("/enrollments/me", getAuthConfig(token));
  return response.data;
}
export async function getEnrollmentProgress(token, enrollmentId) {
  const response = await progressApi.get(`/enrollments/${enrollmentId}/progress`, getAuthConfig(token));
  return response.data;
}
export async function getLearningReflections(token, enrollmentId) {
  const response = await progressApi.get(`/enrollments/${enrollmentId}/reflections`, getAuthConfig(token));
  return response.data;
}
export async function saveLearningReflection(token, enrollmentId, moduleId, payload) {
  const response = await progressApi.put(`/enrollments/${enrollmentId}/reflections/${moduleId}`, payload, getAuthConfig(token));
  return response.data;
}
export async function saveResourceProgress(token, payload) {
  const response = await progressApi.post("/resources/progress", payload, getAuthConfig(token));
  return response.data;
}
export async function addLearningTime(token, payload) {
  const response = await progressApi.post("/learning-time", payload, getAuthConfig(token));
  return response.data;
}
export default progressApi;
