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
    }
};