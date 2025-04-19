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

            return response.data.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
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