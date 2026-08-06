import axios from "axios";

const PROGRESS_API_URL =
  import.meta.env.VITE_PROGRESS_API_URL || "http://localhost:3000/api/progress";

const progressApi = axios.create({
  baseURL: PROGRESS_API_URL,
  timeout: 15000,
});

function getAuthConfig(token) {
  if (!token) {
    throw new Error("Token d'authentification manquant.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

/**
 * Dashboard étudiant
 */
export async function getStudentDashboard(token) {
  const response = await progressApi.get("/dashboard", getAuthConfig(token));

  return response.data;
}

/**
 * Mes inscriptions
 */
export async function getMyEnrollments(token) {
  const response = await progressApi.get(
    "/enrollments/me",
    getAuthConfig(token),
  );

  return response.data;
}

/**
 * Progression d'une inscription
 */
export async function getEnrollmentProgress(token, enrollmentId) {
  const response = await progressApi.get(
    `/enrollments/${enrollmentId}/progress`,
    getAuthConfig(token),
  );

  return response.data;
}

/**
 * Progression d'une ressource
 */
export async function saveResourceProgress(token, payload) {
  const response = await progressApi.post(
    "/resources/progress",
    payload,
    getAuthConfig(token),
  );

  return response.data;
}

/**
 * Temps d'apprentissage
 */
export async function addLearningTime(token, payload) {
  const response = await progressApi.post(
    "/learning-time",
    payload,
    getAuthConfig(token),
  );

  return response.data;
}

export default progressApi;
