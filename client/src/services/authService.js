import api from './api';

/**
 * Authentication and User Management Service
 * Strictly implements Member 1 endpoints:
 * - POST /api/auth/register
 * - POST /api/auth/login
 * - GET  /api/auth/me
 * - GET  /api/users/profile
 * - PUT  /api/users/profile
 */

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  getUserProfile,
  updateUserProfile
};
