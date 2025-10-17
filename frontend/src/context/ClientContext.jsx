import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';

export const ClientContext = createContext();

/**
 * ClientContext
 * Manages current client context for admin users
 * Supports admin context switching via X-Client-Context header
 */
export const ClientProvider = ({ children }) => {
    const { user, isAuthenticated } = useContext(AuthContext);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isContextSwitched, setIsContextSwitched] = useState(false);

    // Reset client context when user changes or logs out
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setSelectedClientId(null);
            setSelectedClient(null);
            setIsContextSwitched(false);
            return;
        }

        // Get clientId from user object (handle both snake_case and camelCase)
        const userClientId = user.client_id || user.clientId;

        // For admin users, default to their own client
        if (user.role === 'admin' && userClientId) {
            // Only set if not already switched
            if (!isContextSwitched) {
                setSelectedClientId(userClientId);
            }
        } else {
            // Non-admin users always use their own client
            setSelectedClientId(userClientId || null);
            setIsContextSwitched(false);
        }
    }, [user, isAuthenticated]);

    /**
     * Switch to a different client context (admin only)
     * @param {Object} client - Client object with id, name, code
     */
    const switchClientContext = (client) => {
        if (!user || user.role !== 'admin') {
            console.error('Only admin users can switch client context');
            return;
        }

        if (!client) {
            // Clear context switch - return to admin's own client
            setSelectedClientId(user.clientId);
            setSelectedClient(null);
            setIsContextSwitched(false);
            return;
        }

        setSelectedClientId(client.id);
        setSelectedClient(client);
        setIsContextSwitched(true);
    };

    /**
     * Clear client context switch (return to admin's own client)
     */
    const clearClientContext = () => {
        if (user && user.role === 'admin') {
            const userClientId = user.client_id || user.clientId;
            setSelectedClientId(userClientId);
            setSelectedClient(null);
            setIsContextSwitched(false);
        }
    };

    /**
     * Get X-Client-Context header value for API calls
     * Returns null if not in switched context
     */
    const getClientContextHeader = () => {
        if (isContextSwitched && selectedClientId) {
            return selectedClientId;
        }
        return null;
    };

    const value = {
        selectedClientId,
        selectedClient,
        isContextSwitched,
        switchClientContext,
        clearClientContext,
        getClientContextHeader,
        isAdmin: user?.role === 'admin'
    };

    return (
        <ClientContext.Provider value={value}>
            {children}
        </ClientContext.Provider>
    );
};

/**
 * Custom hook to use client context
 */
export const useClientContext = () => {
    const context = useContext(ClientContext);
    if (!context) {
        throw new Error('useClientContext must be used within a ClientProvider');
    }
    return context;
};
