import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * List users in client organization (paginated)
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @param {Object} customHeaders - Optional custom headers (e.g., X-Client-Context for admin)
 */
export const listUsers = async (page = 1, limit = 50, customHeaders = {}) => {
  const response = await axios.get(`${API_URL}/users`, {
    params: { page, limit },
    headers: {
      ...getAuthHeader(),
      ...customHeaders
    }
  });
  return response.data;
};

/**
 * Get user details by ID
 */
export const getUserById = async (userId) => {
  const response = await axios.get(`${API_URL}/users/${userId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {Object} customHeaders - Optional custom headers (e.g., X-Client-Context for admin)
 */
export const createUser = async (userData, customHeaders = {}) => {
  const response = await axios.post(`${API_URL}/users`, userData, {
    headers: {
      ...getAuthHeader(),
      ...customHeaders
    }
  });
  return response.data;
};

/**
 * Update user (role or contact details)
 */
export const updateUser = async (userId, updates) => {
  const response = await axios.patch(`${API_URL}/users/${userId}`, updates, {
    headers: getAuthHeader()
  });
  return response.data;
};

/**
 * Delete user (soft delete)
 * @param {number} userId - User ID to delete
 * @param {Object} customHeaders - Optional custom headers (e.g., X-Client-Context for admin)
 */
export const deleteUser = async (userId, customHeaders = {}) => {
  const response = await axios.delete(`${API_URL}/users/${userId}`, {
    headers: {
      ...getAuthHeader(),
      ...customHeaders
    }
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
