import api, { authConfig } from "./api";

function requireToken(token) {
  if (!token) {
    const error = new Error(
      "Token d’authentification manquant.",
    );

    error.statusCode = 401;
    throw error;
  }
}

export async function getInstructorDashboard(token) {
  requireToken(token);

  const response = await api.get(
    "/courses/management/instructor-dashboard",
    authConfig(token),
  );

  return response.data;
}

export async function getInstructorCourses(token) {
  requireToken(token);

  const response = await api.get(
    "/courses/management/my-courses",
    authConfig(token),
  );

  return response.data;
}

export async function getInstructorPaymentAnalytics(
  token,
  months = 6,
) {
  requireToken(token);

  const response = await api.get(
    "/payments/instructor/analytics",
    authConfig(token, { months }),
  );

  return response.data;
}

export async function getCourseCategories() {
  const response = await api.get(
    "/course-categories",
    {
      params: {
        active: true,
        limit: 100,
      },
    },
  );

  return response.data;
}

export async function uploadCourseThumbnail(
  token,
  asset,
) {
  requireToken(token);

  const formData = new FormData();

  const filename =
    asset.fileName ||
    asset.uri?.split("/").pop() ||
    `course-${Date.now()}.jpg`;

  const mimeType =
    asset.mimeType ||
    (filename.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg");

  formData.append("file", {
    uri: asset.uri,
    name: filename,
    type: mimeType,
  });

  const response = await api.post(
    "/uploads/image",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    },
  );

  return response.data;
}

export async function createInstructorCourse(
  token,
  payload,
) {
  requireToken(token);

  const response = await api.post(
    "/courses",
    payload,
    authConfig(token),
  );

  return response.data;
}
