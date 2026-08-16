import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_RECOMMENDATION_API_URL || "http://localhost:3000/api/recommendations",
  timeout: 20000
});
export async function getDashboardRecommendations(token) {
  const response = await api.get("/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}
