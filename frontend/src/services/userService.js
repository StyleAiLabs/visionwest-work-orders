import api from './api';

/**
 * List users in client organization (paginated)
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @param {Object} customHeaders - Optional custom headers (e.g., X-Client-Context for admin)
 */
export const listUsers = async (page = 1, limit = 50, customHeaders = {}) => {
  const response = await api.get('/users', {
    params: { page, limit },
    headers: customHeaders
  });
  return response.data;
};

/**
 * Get user details by ID
 */
export const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {Object} customHeaders - Optional custom headers (e.g., X-Client-Context for admin)
 */
export const createUser = async (userData, customHeaders = {}) => {
  const response = await api.post('/users', userData, {
    headers: customHeaders
  });
  return response.data;
};

/**
 * Update user (role or contact details)
 */
export const updateUser = async (userId, updates) => {
  const response = await api.patch(`/users/${userId}`, updates);
  return response.data;
};

/**
 * Delete user (soft delete)
 * @param {number} userId - User ID to delete
 * @param {Object} customHeaders - Optional custom headers (e.g., X-Client-Context for admin)
 */
export const deleteUser = async (userId, customHeaders = {}) => {
  const response = await api.delete(`/users/${userId}`, {
    headers: customHeaders
  });
  return response.data;
};

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
