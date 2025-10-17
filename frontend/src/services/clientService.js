import api from './api';

/**
 * Client Service
 * API calls for client management (admin only)
 */

/**
 * Get all clients with pagination, filtering, and search
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status: 'active', 'inactive', 'archived'
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Results per page (default: 20, max: 100)
 * @param {string} params.search - Search by name or code
 * @returns {Promise} Response with clients array and pagination info
 */
export const getAllClients = async (params = {}) => {
    try {
        const response = await api.get('/clients', { params });
        return response.data;
    } catch (error) {
        console.error('Get all clients error:', error);
        throw error;
    }
};

/**
 * Get client by ID with user and work order counts
 * @param {number} id - Client ID
 * @returns {Promise} Response with client details
 */
export const getClientById = async (id) => {
    try {
        const response = await api.get(`/clients/${id}`);
        return response.data;
    } catch (error) {
        console.error('Get client by ID error:', error);
        throw error;
    }
};

/**
 * Get client statistics
 * @param {number} id - Client ID
 * @returns {Promise} Response with client statistics
 */
export const getClientStats = async (id) => {
    try {
        const response = await api.get(`/clients/${id}/stats`);
        return response.data;
    } catch (error) {
        console.error('Get client stats error:', error);
        throw error;
    }
};

/**
 * Create new client
 * @param {Object} clientData - Client data
 * @param {string} clientData.name - Client name (required)
 * @param {string} clientData.code - Client code (required, uppercase, alphanumeric+_-)
 * @param {string} clientData.primary_contact_name - Primary contact name
 * @param {string} clientData.primary_contact_email - Primary contact email
 * @param {string} clientData.primary_contact_phone - Primary contact phone
 * @param {string} clientData.status - Status: 'active' (default), 'inactive', 'archived'
 * @returns {Promise} Response with created client
 */
export const createClient = async (clientData) => {
    try {
        const response = await api.post('/clients', clientData);
        return response.data;
    } catch (error) {
        console.error('Create client error:', error);
        throw error;
    }
};

/**
 * Update client (code is immutable)
 * @param {number} id - Client ID
 * @param {Object} updates - Partial client data to update
 * @returns {Promise} Response with updated client
 */
export const updateClient = async (id, updates) => {
    try {
        const response = await api.put(`/clients/${id}`, updates);
        return response.data;
    } catch (error) {
        console.error('Update client error:', error);
        throw error;
    }
};

/**
 * Delete (archive) client
 * @param {number} id - Client ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteClient = async (id) => {
    try {
        const response = await api.delete(`/clients/${id}`, {
            params: { confirm: 'true' }
        });
        return response.data;
    } catch (error) {
        console.error('Delete client error:', error);
        throw error;
    }
};

export default {
    getAllClients,
    getClientById,
    getClientStats,
    createClient,
    updateClient,
    deleteClient
};
