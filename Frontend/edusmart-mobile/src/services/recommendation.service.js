import api, { authConfig } from "./api";
export async function getRecommendations(token) {
  const response = await api.get("/recommendations/dashboard", authConfig(token));
  return response.data;
}
