import api from './api';

export const dashboardService = {
    async getDashboardSummary() {
        try {
            const response = await api.get('/work-orders/summary');
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            throw error;
        }
    },

    async getRecentActivities() {
        try {
            // Using work orders list endpoint with latest filter
            const response = await api.get('/work-orders?sort=latest&limit=5');
            return response.data;
        } catch (error) {
            console.error('Error fetching recent activities:', error);
            throw error;
        }
    }
};