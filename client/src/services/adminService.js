import api from './api';

/**
 * Fetch platform-wide metrics and statistics for admin overview.
 */
export const getAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

/**
 * Fetch users with pagination, search, and role filtering.
 * @param {Object} params - { page, limit, search, role }
 */
export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

/**
 * Delete a user and cascade all their posts/comments/likes.
 * @param {string} id
 */
export const deleteAdminUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

/**
 * Update a user's role (user <-> admin).
 * @param {string} id
 * @param {string} role - 'user' | 'admin'
 */
export const updateAdminUserRole = async (id, role) => {
  const response = await api.patch(`/admin/users/${id}/role`, { role });
  return response.data;
};

/**
 * Fetch all posts across platform for moderation.
 * @param {Object} params - { page, limit, search, category }
 */
export const getAdminPosts = async (params = {}) => {
  const response = await api.get('/admin/posts', { params });
  return response.data;
};

/**
 * Moderate and delete any post.
 * @param {string} id
 */
export const deleteAdminPost = async (id) => {
  const response = await api.delete(`/admin/posts/${id}`);
  return response.data;
};

/**
 * Fetch all comments across platform for moderation.
 * @param {Object} params - { page, limit, search }
 */
export const getAdminComments = async (params = {}) => {
  const response = await api.get('/admin/comments', { params });
  return response.data;
};

/**
 * Moderate and delete any comment.
 * @param {string} id
 */
export const deleteAdminComment = async (id) => {
  const response = await api.delete(`/admin/comments/${id}`);
  return response.data;
};

export default {
  getAdminStats,
  getAdminUsers,
  deleteAdminUser,
  updateAdminUserRole,
  getAdminPosts,
  deleteAdminPost,
  getAdminComments,
  deleteAdminComment
};

