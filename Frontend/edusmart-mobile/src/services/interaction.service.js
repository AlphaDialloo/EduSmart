import api, { authConfig } from "./api";
export async function getCoursePosts(courseId) {
  const response = await api.get(`/interactions/courses/${courseId}/posts`);
  return response.data;
}
export async function createCoursePost(token, payload) {
  const response = await api.post("/interactions/posts", payload, authConfig(token));
  return response.data;
}
export async function reactToPost(token, postId, reaction) {
  const response = await api.patch(`/interactions/posts/${postId}/reaction`, {
    reaction
  }, authConfig(token));
  return response.data;
}
export async function getPostComments(postId) {
  const response = await api.get(`/interactions/posts/${postId}/comments`);
  return response.data;
}
export async function createComment(token, postId, content) {
  const response = await api.post(`/interactions/posts/${postId}/comments`, {
    content
  }, authConfig(token));
  return response.data;
}
