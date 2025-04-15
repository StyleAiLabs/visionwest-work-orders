// src/services/authService.js
import api from './api';

export const authService = {
    async login(email, password) {
        try {
            // DEVELOPMENT MODE: Skip real API call and return mock user data
            // Remove or comment out this section when you have a real backend
            console.log('DEV MODE: Bypassing real login API');

            // Store a mock token
            localStorage.setItem('token', 'mock-jwt-token');

            // Return mock user data
            return {
                id: 1,
                name: 'Test User',
                email: email,
                role: 'staff'
            };

            // PRODUCTION MODE: Uncomment this when you have a real backend
            /*
            const response = await api.post('/auth/login', { email, password });
            
            // Store token in localStorage
            if (response.data.token) {
              localStorage.setItem('token', response.data.token);
            }
            
            return response.data.user;
            */
        } catch (error) {
            throw error;
        }
    },

    async logout() {
        try {
            // No need to call API in development mode
            // await api.post('/auth/logout');
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
            // DEVELOPMENT MODE: Return mock user data
            // Remove this when you have a real backend
            return {
                id: 1,
                name: 'Test User',
                email: 'user@example.com',
                role: 'staff'
            };

            // PRODUCTION MODE: Uncomment this when you have a real backend
            /*
            const response = await api.get('/auth/me');
            return response.data;
            */
        } catch (error) {
            // If request fails, clear token as it might be invalid
            localStorage.removeItem('token');
            return null;
        }
    }
};