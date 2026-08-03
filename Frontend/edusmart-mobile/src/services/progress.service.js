import api, { authConfig } from "./api";

export async function getEnrollmentProgress(
  token,
  enrollmentId,
) {
  const response = await api.get(
    `/progress/enrollments/${enrollmentId}/progress`,
    authConfig(token),
  );

  return response.data;
}

export async function saveResourceProgress(
  token,
  payload,
) {
  const response = await api.post(
    "/progress/resources/progress",
    payload,
    authConfig(token),
  );

  return response.data;
}
