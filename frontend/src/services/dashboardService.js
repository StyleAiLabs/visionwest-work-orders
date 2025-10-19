import api from './api';

/**
 * Add X-Client-Context header for admin context switching
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

export const dashboardService = {
    async getDashboardSummary(clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.get('/work-orders/summary', config);
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            throw error;
        }
    },

    async getRecentActivities(clientId = null) {
        try {
            // Using work orders list endpoint with latest filter
            const config = addClientContextHeader({}, clientId);
            const response = await api.get('/work-orders?sort=latest&limit=5', config);
            return response.data;
        } catch (error) {
            console.error('Error fetching recent activities:', error);
            throw error;
        }
    }
};