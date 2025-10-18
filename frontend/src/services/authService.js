// src/services/authService.js
import api from './api';

export const authService = {
    async login(email, password) {
        try {
            // Send login request to the real backend API
            const response = await api.post('/auth/login', { email, password });

            // Store token in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }

            // Store requirePasswordChange flag if present
            if (response.data.requirePasswordChange !== undefined) {
                localStorage.setItem('requirePasswordChange', response.data.requirePasswordChange.toString());
            }

            return {
                user: response.data.user,
                requirePasswordChange: response.data.requirePasswordChange || false
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });

            // Clear the requirePasswordChange flag on successful password change
            localStorage.removeItem('requirePasswordChange');

            return response.data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    },

    requiresPasswordChange() {
        return localStorage.getItem('requirePasswordChange') === 'true';
    },

    async logout() {
        try {
            // Call the logout endpoint
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Remove token from localStorage regardless of API response
            localStorage.removeItem('token');
        }
    },

    async getCurrentUser() {
        // If no token exists, user is not logged in
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            // Get the current user from the API
            const response = await api.get('/auth/me');
            return response.data.user;
        } catch (error) {
            // If request fails, clear token as it might be invalid
            console.error('Get current user error:', error);
            localStorage.removeItem('token');
            return null;
        }
    }
};