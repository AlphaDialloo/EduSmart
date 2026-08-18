import axios from "axios";
import { getApiUrl } from "./apiUrl";
const api = axios.create({
  baseURL: import.meta.env.VITE_RECOMMENDATION_API_URL || getApiUrl("recommendations"),
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
