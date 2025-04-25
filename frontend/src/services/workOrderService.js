import api from './api';

export const workOrderService = {
    async getWorkOrders(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
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
            const response = await api.post(`/work-orders/${workOrderId}/notes`, { content });
            return response.data;
        } catch (error) {
            console.error('Error adding note:', error);
            throw error;
        }
    }
};