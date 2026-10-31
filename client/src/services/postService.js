import api from './api';

/**
 * Fetch paginated posts with optional search, category, and sorting filters.
 * @param {Object} params - { page, limit, search, category, sort, author }
 */
export const getPosts = async (params = {}) => {
  const response = await api.get('/posts', { params });
  return response.data;
};

/**
 * Fetch a single post by ID with populated author details.
 * @param {string} id
 */
export const getPostById = async (id) => {
  const response = await api.get(`/posts/${id}`);
  return response.data;
};

/**
 * Fetch authenticated user's own posts with optional pagination and search.
 * @param {Object} params - { page, limit, search, category }
 */
export const getMyPosts = async (params = {}) => {
  const response = await api.get('/posts/my', { params });
  return response.data;
};

/**
 * Create a new post.
 * @param {Object} postData - { title, content, image, category }
 */
export const createPost = async (postData) => {
  const response = await api.post('/posts', postData);
  return response.data;
};

/**
 * Update an existing post.
 * @param {string} id
 * @param {Object} postData - { title, content, image, category }
 */
export const updatePost = async (id, postData) => {
  const response = await api.put(`/posts/${id}`, postData);
  return response.data;
};

/**
 * Delete a post by ID.
 * @param {string} id
 */
export const deletePost = async (id) => {
  const response = await api.delete(`/posts/${id}`);
  return response.data;
};

/**
 * Like a post.
 * @param {string} id
 */
export const likePost = async (id) => {
  const response = await api.post(`/posts/${id}/like`);
  return response.data;
};

/**
 * Unlike a post.
 * @param {string} id
 */
export const unlikePost = async (id) => {
  const response = await api.delete(`/posts/${id}/like`);
  return response.data;
};

/**
 * Toggle like/unlike on a post.
 * @param {string} id
 */
export const toggleLikePost = async (id) => {
  const response = await api.put(`/posts/${id}/like`);
  return response.data;
};

export default {
  getPosts,
  getPostById,
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  toggleLikePost
};
