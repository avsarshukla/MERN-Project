import api from './api';

/**
 * Fetch authenticated user dashboard metrics and activity.
 */
export const getUserDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export default {
  getUserDashboardStats
};

