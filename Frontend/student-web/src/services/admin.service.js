import axios from "axios";

const USER_API_URL =
  import.meta.env.VITE_USER_API_URL ||
  "http://localhost:3000/api/users";

const COURSE_API_URL =
  import.meta.env.VITE_COURSE_API_URL ||
  "http://localhost:3000/api/courses";

const PAYMENT_API_URL =
  import.meta.env.VITE_PAYMENT_API_URL ||
  "http://localhost:3000/api/payments";

const userApi = axios.create({
  baseURL: USER_API_URL,
  timeout: 15000,
});

const courseApi = axios.create({
  baseURL: COURSE_API_URL,
  timeout: 15000,
});

const paymentApi = axios.create({
  baseURL: PAYMENT_API_URL,
  timeout: 15000,
});

function authConfig(token, params) {
  if (!token) {
    throw new Error("Token d’authentification manquant.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  };
}

export async function getAdminDashboard(token, months = 6) {
  const [users, courses, payments] = await Promise.allSettled([
    userApi.get("/admin/summary", authConfig(token)),
    courseApi.get("/admin/summary", authConfig(token)),
    paymentApi.get(
      "/admin/summary",
      authConfig(token, { months }),
    ),
  ]);

  const userData =
    users.status === "fulfilled" ? users.value.data : {};

  const courseData =
    courses.status === "fulfilled" ? courses.value.data : {};

  const paymentData =
    payments.status === "fulfilled" ? payments.value.data : {};

  return {
    stats: {
      totalUsers:
        Number(
          userData.stats?.totalUsers ??
            userData.totalUsers,
        ) || 0,

      students:
        Number(
          userData.stats?.students ??
            userData.students,
        ) || 0,

      instructors:
        Number(
          userData.stats?.instructors ??
            userData.instructors,
        ) || 0,

      administrators:
        Number(
          userData.stats?.administrators ??
            userData.administrators,
        ) || 0,

      totalCourses:
        Number(
          courseData.stats?.totalCourses ??
            courseData.totalCourses,
        ) || 0,

      publishedCourses:
        Number(
          courseData.stats?.publishedCourses ??
            courseData.publishedCourses,
        ) || 0,

      draftCourses:
        Number(
          courseData.stats?.draftCourses ??
            courseData.draftCourses,
        ) || 0,

      archivedCourses:
        Number(
          courseData.stats?.archivedCourses ??
            courseData.archivedCourses,
        ) || 0,

      totalSales:
        Number(
          paymentData.stats?.totalSales ??
            paymentData.totalSales,
        ) || 0,

      totalRevenue:
        Number(
          paymentData.stats?.totalRevenue ??
            paymentData.totalRevenue,
        ) || 0,

      monthlyRevenue:
        Number(
          paymentData.stats?.monthlyRevenue ??
            paymentData.currentMonthRevenue,
        ) || 0,
    },

    monthlyRevenue:
      paymentData.monthlyRevenueSeries ||
      paymentData.monthlyRevenue ||
      [],

    monthlySales:
      paymentData.monthlySales || [],

    recentUsers:
      userData.recentUsers ||
      userData.latestUsers ||
      [],

    recentCourses:
      courseData.recentCourses ||
      courseData.latestCourses ||
      [],

    recentPayments:
      paymentData.recentPayments ||
      paymentData.latestPayments ||
      [],

    unavailable: {
      users: users.status === "rejected",
      courses: courses.status === "rejected",
      payments: payments.status === "rejected",
    },
  };
}

export async function getAdminUsers(
  token,
  params = {},
) {
  const response = await userApi.get(
    "/admin",
    authConfig(token, params),
  );

  return response.data;
}

export async function updateAdminUser(
  token,
  userId,
  payload,
) {
  const response = await userApi.patch(
    `/admin/${userId}`,
    payload,
    authConfig(token),
  );

  return response.data;
}

export async function getAdminCourses(
  token,
  params = {},
) {
  const response = await courseApi.get(
    "/admin",
    authConfig(token, params),
  );

  return response.data;
}

export async function updateAdminCourseStatus(
  token,
  courseId,
  status,
) {
  const response = await courseApi.patch(
    `/admin/${courseId}/status`,
    { status },
    authConfig(token),
  );

  return response.data;
}

export async function getAdminPayments(
  token,
  params = {},
) {
  const response = await paymentApi.get(
    "/admin",
    authConfig(token, params),
  );

  return response.data;
}
