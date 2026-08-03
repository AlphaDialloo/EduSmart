import api, { authConfig } from "./api";

export async function listPublishedCourses(params = {}) {
  const response = await api.get("/courses", {
    params,
  });

  return response.data;
}

export async function getCourseById(courseId) {
  const response = await api.get(`/courses/${courseId}`);
  return response.data;
}

export async function getStudentCourses(token) {
  const response = await api.get(
    "/courses/student/enrollments",
    authConfig(token),
  );

  return response.data;
}

export async function getStudentCourseById(
  token,
  courseId,
) {
  const response = await api.get(
    `/courses/student/enrollments/${courseId}`,
    authConfig(token),
  );

  return response.data;
}
