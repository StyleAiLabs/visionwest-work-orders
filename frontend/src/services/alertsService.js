import api from './api';

// Helper to check auth state
const isAuthenticated = () => !!localStorage.getItem('token');

export const alertsService = {
    async getAlerts(filter = 'all') {
        if (!isAuthenticated()) return { data: [] };

        try {
            const response = await api.get(`/alerts?filter=${filter}`);

            // Handle both formats (direct array or nested in data property)
            const alerts = Array.isArray(response.data) ? response.data : (response.data.data || []);

            console.log('Fetched alerts:', alerts);

            return { data: alerts };
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return { data: [] };
        }
    },

    async markAsRead(alertId) {
        if (!isAuthenticated()) return;

        try {
            return await api.patch(`/alerts/${alertId}`);
        } catch (error) {
            console.error('Error marking alert as read:', error);
            throw error;
        }
    },

    async markAllAsRead() {
        if (!isAuthenticated()) return;

        try {
            return await api.patch('/alerts/mark-all-read');
        } catch (error) {
            console.error('Error marking all alerts as read:', error);
            throw error;
        }
    },

    async getUnreadCount() {
        if (!isAuthenticated()) return 0;

        try {
            const response = await api.get('/alerts/unread-count');
            return response.data.count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }
};