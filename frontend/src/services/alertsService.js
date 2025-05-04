import api from './api';

export const alertsService = {
    async getAlerts(filter = 'all') {
        try {
            const response = await api.get(`/alerts?filter=${filter}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching alerts:', error);
            throw error;
        }
    },

    async markAsRead(alertId) {
        try {
            return await api.patch(`/alerts/${alertId}`);
        } catch (error) {
            console.error('Error marking alert as read:', error);
            throw error;
        }
    },

    async markAllAsRead() {
        try {
            return await api.patch('/alerts/mark-all-read');
        } catch (error) {
            console.error('Error marking all alerts as read:', error);
            throw error;
        }
    },

    async getUnreadCount() {
        try {
            const response = await api.get('/alerts/unread-count');
            return response.data.count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }
};