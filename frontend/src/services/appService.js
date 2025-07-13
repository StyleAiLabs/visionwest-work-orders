import api from './api';

export const appService = {
    // Get app information
    async getAppInfo() {
        try {
            const response = await api.get('/app/info');
            return response.data;
        } catch (error) {
            console.error('Error fetching app info:', error);
            throw error;
        }
    },

    // Get release notes
    async getReleaseNotes() {
        try {
            const response = await api.get('/app/releases');
            return response.data;
        } catch (error) {
            console.error('Error fetching release notes:', error);
            throw error;
        }
    }
};
