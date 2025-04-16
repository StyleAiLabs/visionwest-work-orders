import api from './api';

export const alertsService = {
    async getAlerts() {
        try {
            // In a real implementation, this would use the actual API call
            // return await api.get('/alerts');

            // For now, return mock data
            return {
                data: [
                    {
                        id: 1,
                        type: 'work-order',
                        title: 'New Work Order Assigned',
                        message: 'Job #RBWO010986 has been assigned to you',
                        time: '2 hours ago',
                        read: false,
                        workOrderId: '1'
                    },
                    {
                        id: 2,
                        type: 'status-change',
                        title: 'Status Updated',
                        message: 'Job #RBWO010932 changed from "In Progress" to "Completed"',
                        time: '5 hours ago',
                        read: false,
                        workOrderId: '3'
                    },
                    {
                        id: 3,
                        type: 'urgent',
                        title: 'Urgent: Action Required',
                        message: 'Job #RBWO010943 requires immediate attention',
                        time: '1 day ago',
                        read: true,
                        workOrderId: '2'
                    },
                    {
                        id: 4,
                        type: 'completion',
                        title: 'Work Order Completed',
                        message: 'Job #RBWO010915 has been marked as completed',
                        time: '2 days ago',
                        read: true,
                        workOrderId: '3'
                    },
                    {
                        id: 5,
                        type: 'work-order',
                        title: 'Document Updated',
                        message: 'New documentation added to Job #RBWO010932',
                        time: '3 days ago',
                        read: true,
                        workOrderId: '3'
                    }
                ]
            };
        } catch (error) {
            console.error('Error fetching alerts:', error);
            throw error;
        }
    },

    async markAsRead(alertId) {
        try {
            // In a real implementation, this would use the actual API call
            // return await api.patch(`/alerts/${alertId}`, { read: true });

            // For mock implementation, just return a success response
            return { success: true };
        } catch (error) {
            console.error(`Error marking alert ${alertId} as read:`, error);
            throw error;
        }
    },

    async markAllAsRead() {
        try {
            // In a real implementation, this would use the actual API call
            // return await api.patch('/alerts/mark-all-read');

            // For mock implementation, just return a success response
            return { success: true };
        } catch (error) {
            console.error('Error marking all alerts as read:', error);
            throw error;
        }
    },

    // Get unread count for notifications badge
    async getUnreadCount() {
        try {
            // In a real implementation, this would use the actual API call
            // const response = await api.get('/alerts/unread-count');
            // return response.data.count;

            // For mock implementation, calculate from the mock data
            const alerts = await this.getAlerts();
            return alerts.data.filter(alert => !alert.read).length;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0; // Return 0 as a fallback
        }
    }
};