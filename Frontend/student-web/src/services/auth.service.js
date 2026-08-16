import axios from "axios";
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:3000/api/auth";
const authApi = axios.create({
  baseURL: AUTH_API_URL,
  timeout: 15000
});
export async function login(credentials) {
  const response = await authApi.post("/login", credentials);
  return response.data;
}
export async function register(payload) {
  const response = await authApi.post("/register", payload);
  return response.data;
}
export async function getMe(token) {
  const response = await authApi.get("/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}
export default authApi;
