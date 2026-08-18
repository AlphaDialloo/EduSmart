import axios from "axios";
import { getApiUrl } from "./apiUrl";
const COURSE_API_URL = import.meta.env.VITE_COURSE_API_URL || getApiUrl("courses");
const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL || getApiUrl("payments");
const instructorApi = axios.create({
  baseURL: COURSE_API_URL,
  timeout: 20000
});
const instructorPaymentApi = axios.create({
  baseURL: PAYMENT_API_URL,
  timeout: 20000
});
function getAuthConfig(token) {
  if (!token) throw new Error("Token d’authentification manquant.");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  };
}
export async function getInstructorDashboard(token) {
  const response = await instructorApi.get("/management/instructor-dashboard", getAuthConfig(token));
  return response.data;
}
export async function getInstructorPaymentAnalytics(token, months = 6) {
  const response = await instructorPaymentApi.get("/instructor/analytics", {
    ...getAuthConfig(token),
    params: {
      months
    }
  });
  return response.data;
}
export async function getInstructorCourses(token) {
  const response = await instructorApi.get("/management/my-courses", getAuthConfig(token));
  return response.data;
}
export async function getInstructorCourseById(token, courseId) {
  const response = await instructorApi.get(`/management/${courseId}`, getAuthConfig(token));
  return response.data;
}
export async function createInstructorCourse(token, payload) {
  const response = await instructorApi.post("/", payload, getAuthConfig(token));
  return response.data;
}
export async function updateInstructorCourse(token, courseId, payload) {
  const response = await instructorApi.put(`/${courseId}`, payload, getAuthConfig(token));
  return response.data;
}
export async function publishCourse(token, courseId) {
  const response = await instructorApi.patch(`/${courseId}/publish`, {}, getAuthConfig(token));
  return response.data;
}
export async function unpublishCourse(token, courseId) {
  const response = await instructorApi.patch(`/${courseId}/unpublish`, {}, getAuthConfig(token));
  return response.data;
}
export async function archiveCourse(token, courseId) {
  const response = await instructorApi.patch(`/${courseId}/archive`, {}, getAuthConfig(token));
  return response.data;
}
export async function addCourseModule(token, courseId, payload) {
  const response = await instructorApi.post(`/${courseId}/modules`, payload, getAuthConfig(token));
  return response.data;
}
export async function updateCourseModule(token, courseId, moduleId, payload) {
  const response = await instructorApi.put(`/${courseId}/modules/${moduleId}`, payload, getAuthConfig(token));
  return response.data;
}
export async function deleteCourseModule(token, courseId, moduleId) {
  const response = await instructorApi.delete(`/${courseId}/modules/${moduleId}`, getAuthConfig(token));
  return response.data;
}
export async function addCourseResource(token, courseId, moduleId, payload) {
  const response = await instructorApi.post(`/${courseId}/modules/${moduleId}/resources`, payload, getAuthConfig(token));
  return response.data;
}
export async function updateCourseResource(token, courseId, moduleId, resourceId, payload) {
  const response = await instructorApi.put(`/${courseId}/modules/${moduleId}/resources/${resourceId}`, payload, getAuthConfig(token));
  return response.data;
}
export async function deleteCourseResource(token, courseId, moduleId, resourceId) {
  const response = await instructorApi.delete(`/${courseId}/modules/${moduleId}/resources/${resourceId}`, getAuthConfig(token));
  return response.data;
}
export async function getCourseQuizzes(token, courseId) {
  const response = await instructorApi.get(`/${courseId}/quizzes`, getAuthConfig(token));
  return response.data;
}
export async function getCourseQuiz(token, courseId, quizId) {
  const response = await instructorApi.get(`/${courseId}/quizzes/${quizId}`, getAuthConfig(token));
  return response.data;
}
export async function addCourseQuiz(token, courseId, payload) {
  const response = await instructorApi.post(`/${courseId}/quizzes`, payload, getAuthConfig(token));
  return response.data;
}
export async function updateCourseQuiz(token, courseId, quizId, payload) {
  const response = await instructorApi.put(`/${courseId}/quizzes/${quizId}`, payload, getAuthConfig(token));
  return response.data;
}
export async function deleteCourseQuiz(token, courseId, quizId) {
  const response = await instructorApi.delete(`/${courseId}/quizzes/${quizId}`, getAuthConfig(token));
  return response.data;
}
export default instructorApi;
