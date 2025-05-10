import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const normalizeUser = (apiUser) => {
        return {
            id: apiUser.id,
            name: apiUser.full_name || apiUser.name || 'Unknown',
            email: apiUser.email || '',
            role: apiUser.role || 'user',
            // add other fields as needed
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
            } catch (error) {
                console.error('Auth check failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = async (email, password) => {
        const userData = await authService.login(email, password);
        setUser(normalizeUser(userData));
        setIsAuthenticated(true);
        return userData;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};