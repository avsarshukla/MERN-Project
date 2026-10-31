import api from './api';

/**
 * Get all comments for a post.
 * @param {string} postId
 */
export const getPostComments = async (postId) => {
  const response = await api.get(`/posts/${postId}/comments`);
  return response.data;
};

/**
 * Add a new comment to a post.
 * @param {string} postId
 * @param {string} content
 */
export const addComment = async (postId, content) => {
  const response = await api.post(`/posts/${postId}/comments`, { content });
  return response.data;
};

/**
 * Update an existing comment.
 * @param {string} id
 * @param {string} content
 */
export const updateComment = async (id, content) => {
  const response = await api.put(`/comments/${id}`, { content });
  return response.data;
};

/**
 * Delete a comment.
 * @param {string} id
 */
export const deleteComment = async (id) => {
  const response = await api.delete(`/comments/${id}`);
  return response.data;
};

export default {
  getPostComments,
  addComment,
  updateComment,
  deleteComment
};

