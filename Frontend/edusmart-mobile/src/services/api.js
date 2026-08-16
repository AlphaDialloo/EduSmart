import axios from "axios";
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json"
  }
});
export function authConfig(token, params) {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params
  };
}
export default api;
