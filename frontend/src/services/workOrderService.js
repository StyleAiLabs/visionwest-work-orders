import api from './api';

/**
 * Add X-Client-Context header for admin context switching
 * @param {Object} config - Axios config object
 * @param {number|null} clientId - Client ID to switch context to (admin only)
 * @returns {Object} Config with X-Client-Context header if applicable
 */
const addClientContextHeader = (config = {}, clientId = null) => {
    if (clientId) {
        return {
            ...config,
            headers: {
                ...config.headers,
                'X-Client-Context': clientId
            }
        };
    }
    return config;
};

export const workOrderService = {
    async getWorkOrders(filters = {}, clientId = null) {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            if (filters.authorized_person) params.append('authorized_person', filters.authorized_person);
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const config = addClientContextHeader({}, clientId);
            const response = await api.get(`/work-orders?${params}`, config);
            return response.data;
        } catch (error) {
            console.error('Error fetching work orders:', error);
            throw error;
        }
    },

    async getAuthorizedPersons(clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.get('/work-orders/authorized-persons', config);
            return response.data;
        } catch (error) {
            console.error('Error fetching authorized persons:', error);
            throw error;
        }
    },

    async getWorkOrderById(id, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.get(`/work-orders/${id}`, config);
            return response.data;
        } catch (error) {
            console.error('Error fetching work order:', error);
            throw error;
        }
    },

    async updateStatus(id, status, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.patch(`/work-orders/${id}/status`, { status }, config);
            return response.data;
        } catch (error) {
            console.error('Error updating status:', error);
            throw error;
        }
    },

    async addNote(workOrderId, content, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.post(`/work-orders/${workOrderId}/notes`, {
                note: content,
                // Make sure other required fields are included
                work_order_id: workOrderId
            }, config);

            return response.data;
        } catch (error) {
            // Enhanced error logging
            console.error('Error adding note:', error.response?.data || error.message);
            throw error;
        }
    },

    async updateWorkOrderStatus(id, status, notes = '', clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.patch(`/work-orders/${id}/status`, {
                status,
                notes
            }, config);
            return response.data;
        } catch (error) {
            console.error('Error updating work order status:', error);
            throw error;
        }
    },

    async createWorkOrder(formData, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.post('/work-orders', formData, config);
            return response.data;
        } catch (error) {
            console.error('Error creating work order:', error);
            throw error;
        }
    },

    async updateWorkOrder(id, updateData, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.patch(`/work-orders/${id}`, updateData, config);
            return response.data;
        } catch (error) {
            console.error('Error updating work order:', error);
            throw error;
        }
    }
};