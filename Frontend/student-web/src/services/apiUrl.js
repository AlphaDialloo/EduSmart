const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

export function getApiUrl(path) {
  return `${apiUrl}/${path.replace(/^\//, "")}`;
}
