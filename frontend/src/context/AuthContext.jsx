import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [requirePasswordChange, setRequirePasswordChange] = useState(false);

    const normalizeUser = (apiUser) => {
        return {
            id: apiUser.id,
            name: apiUser.full_name || apiUser.name || 'Unknown',
            email: apiUser.email || '',
            role: apiUser.role || 'user',
            client_id: apiUser.client_id,
            clientId: apiUser.client_id, // Support camelCase
            client: apiUser.client,
            full_name: apiUser.full_name,
            phone_number: apiUser.phone_number,
            username: apiUser.username
        };
    };

    useEffect(() => {
        // Check if user is already logged in
        const checkAuthStatus = async () => {
            try {
                const userData = await authService.getCurrentUser();
                if (userData) {
                    setUser(normalizeUser(userData));
                    setIsAuthenticated(true);
                }
                // Check if password change is required
                setRequirePasswordChange(authService.requiresPasswordChange());
            } catch (error) {
                console.error('Auth check failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = async (email, password) => {
        const response = await authService.login(email, password);
        setUser(normalizeUser(response.user));
        setIsAuthenticated(true);
        setRequirePasswordChange(response.requirePasswordChange || false);
        return response;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        setRequirePasswordChange(false);
    };

    const changePassword = async (currentPassword, newPassword) => {
        const result = await authService.changePassword(currentPassword, newPassword);
        setRequirePasswordChange(false);
        return result;
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        requirePasswordChange,
        login,
        logout,
        changePassword
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};