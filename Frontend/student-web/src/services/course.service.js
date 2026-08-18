import axios from "axios";
import { getApiUrl } from "./apiUrl";
const COURSE_API_URL = import.meta.env.VITE_COURSE_API_URL || getApiUrl("courses");
const courseApi = axios.create({
  baseURL: COURSE_API_URL,
  timeout: 70000
});
function getLowestActivePlan(course) {
  const plans = Array.isArray(course?.pricing?.accessPlans) ? course.pricing.accessPlans.filter(plan => plan?.isActive !== false) : [];
  if (course?.pricing?.isFree) {
    return null;
  }
  return plans.reduce((lowest, plan) => {
    const currentPrice = Number(plan?.price);
    if (!Number.isFinite(currentPrice)) {
      return lowest;
    }
    if (!lowest || currentPrice < Number(lowest.price)) {
      return plan;
    }
    return lowest;
  }, null);
}
function calculateDuration(course) {
  const totalMinutes = (course?.modules || []).reduce((moduleTotal, module) => moduleTotal + (module?.resources || []).reduce((resourceTotal, resource) => resourceTotal + Number(resource?.durationMinutes || 0), 0), 0);
  if (!totalMinutes) {
    return "Durée à venir";
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) {
    return `${minutes} min`;
  }
  return minutes ? `${hours} h ${minutes}` : `${hours} h`;
}
function translateLevel(level) {
  const levels = {
    BEGINNER: "Débutant",
    INTERMEDIATE: "Intermédiaire",
    ADVANCED: "Avancé"
  };
  return levels[level] || level || "Tous niveaux";
}
function getInstructorName(course) {
  if (course?.instructor?.fullName) {
    return course.instructor.fullName;
  }
  const firstName = course?.instructor?.firstName || "";
  const lastName = course?.instructor?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || course?.instructorName || "Instructeur EduSmart";
}
function getCategory(course) {
  const category = course?.categoryId;
  if (category && typeof category === "object") {
    return {
      name: category.name || "Sans catégorie",
      slug: category.slug
    };
  }
  if (course?.category && typeof course.category === "object") {
    return {
      name: course.category.name || "Sans catégorie",
      slug: course.category.slug
    };
  }
  return {
    name: "Sans catégorie",
    slug: undefined
  };
}
export function normalizeCourse(course = {}) {
  const lowestPlan = getLowestActivePlan(course);
  const category = getCategory(course);
  const isSponsored = course?.sponsorship?.isSponsored === true;
  return {
    ...course,
    id: course._id || course.id,
    image: course?.thumbnail?.url || "https://placehold.co/900x520/e2e8f0/475569?text=EduSmart",
    imageAlt: course?.thumbnail?.altText || course?.title || "Cours EduSmart",
    category: category.name,
    categorySlug: category.slug,
    levelLabel: translateLevel(course?.level),
    instructor: getInstructorName(course),
    isFree: course?.pricing?.isFree === true,
    price: course?.pricing?.isFree === true ? 0 : Number(lowestPlan?.price || 0),
    currency: course?.pricing?.baseCurrency || "CAD",
    accessPlanId: lowestPlan?._id || null,
    duration: calculateDuration(course),
    modulesCount: Array.isArray(course?.modules) ? course.modules.length : 0,
    lessonsCount: Array.isArray(course?.modules) ? course.modules.reduce((total, module) => total + (Array.isArray(module?.resources) ? module.resources.length : 0), 0) : 0,
    rating: Number(course?.stats?.averageRating || 0),
    reviewCount: Number(course?.stats?.reviewCount || course?.stats?.reviews || 0),
    studentsCount: Number(course?.stats?.studentsCount || course?.stats?.students || 0),
    badge: isSponsored ? "Sponsorisé" : null
  };
}
export async function getCourses(params = {}) {
  const response = await courseApi.get("/", {
    params
  });
  const rawCourses = Array.isArray(response.data) ? response.data : response.data?.courses || response.data?.data || [];
  return {
    ...response.data,
    courses: rawCourses.map(normalizeCourse)
  };
}
export async function getCourseById(courseId) {
  if (!courseId) {
    throw new Error("L'identifiant du cours est obligatoire.");
  }
  const response = await courseApi.get(`/${courseId}`);
  const rawCourse = response.data?.course || response.data?.data || response.data;
  return normalizeCourse(rawCourse);
}
export default courseApi;
function authConfig(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}
export async function getStudentCourseById(token, courseId) {
  const response = await courseApi.get(`/student/enrollments/${courseId}`, authConfig(token));
  return response.data;
}
export async function getStudentQuiz(token, courseId, quizId) {
  const response = await courseApi.get(`/${courseId}/quizzes/${quizId}/student`, authConfig(token));
  return response.data;
}
export async function submitCourseQuiz(token, courseId, quizId, answers) {
  const response = await courseApi.post(`/${courseId}/quizzes/${quizId}/submit`, {
    answers
  }, authConfig(token));
  return response.data;
}
