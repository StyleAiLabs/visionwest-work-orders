import api from './api';

export const workOrderService = {
    async getWorkOrders(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            if (filters.authorized_person) params.append('authorized_person', filters.authorized_person);
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await api.get(`/work-orders?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching work orders:', error);
            throw error;
        }
    },

    async getAuthorizedPersons() {
        try {
            const response = await api.get('/work-orders/authorized-persons');
            return response.data;
        } catch (error) {
            console.error('Error fetching authorized persons:', error);
            throw error;
        }
    },

    async getWorkOrderById(id) {
        try {
            const response = await api.get(`/work-orders/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching work order:', error);
            throw error;
        }
    },

    async updateStatus(id, status) {
        try {
            const response = await api.patch(`/work-orders/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating status:', error);
            throw error;
        }
    },

    async addNote(workOrderId, content) {
        try {
            // Add console log to see what's being sent
            console.log('Adding note with:', { workOrderId, content });

            // Try with the correct field name expected by the backend
            // The backend might be expecting 'note' instead of 'content'
            const response = await api.post(`/work-orders/${workOrderId}/notes`, {
                note: content,
                // Make sure other required fields are included
                work_order_id: workOrderId
            });

            return response.data;
        } catch (error) {
            // Enhanced error logging
            console.error('Error adding note:', error.response?.data || error.message);
            throw error;
        }
    },

    async updateWorkOrderStatus(id, status, notes = '') {
        try {
            const response = await api.patch(`/work-orders/${id}/status`, {
                status,
                notes
            });
            return response.data;
        } catch (error) {
            console.error('Error updating work order status:', error);
            throw error;
        }
    }
};