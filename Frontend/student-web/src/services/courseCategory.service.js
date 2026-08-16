import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_CATEGORY_API_URL || "http://localhost:3000/api/course-categories",
  timeout: 15000
});
const auth = token => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
});
export const getPublicCourseCategories = async () => (await api.get("/")).data;
export const getAdminCourseCategories = async token => (await api.get("/management", auth(token))).data;
export const createCourseCategory = async (token, payload) => (await api.post("/", payload, auth(token))).data;
export const updateCourseCategory = async (token, id, payload) => (await api.put(`/${id}`, payload, auth(token))).data;
export const updateCourseCategoryStatus = async (token, id, isActive) => (await api.patch(`/${id}/status`, {
  isActive
}, auth(token))).data;
export const deleteCourseCategory = async (token, id) => (await api.delete(`/${id}`, auth(token))).data;
