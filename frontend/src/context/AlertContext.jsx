import React, { createContext, useState, useEffect, useContext } from 'react';
import { alertsService } from '../services/alertsService';
import { useAuth } from '../hooks/useAuth'; // Import your auth hook

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false); // Start with false
    const { isAuthenticated } = useAuth(); // Get authentication status

    const fetchAlerts = async () => {
        // Skip API calls if not authenticated
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            const response = await alertsService.getAlerts();

            // Debug logging
            console.log('Alerts response:', response.data);

            // Ensure we have an array to work with
            const alertsData = Array.isArray(response.data) ? response.data : [];

            // More debugging
            console.log('Processed alerts:', alertsData);

            setAlerts(alertsData);
            calculateUnreadCount(alertsData);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateUnreadCount = (alertsData) => {
        if (!alertsData || !Array.isArray(alertsData)) return;
        const count = alertsData.filter(alert => !alert.read).length;
        setUnreadCount(count);
    };

    useEffect(() => {
        // Only fetch alerts and set up interval if authenticated
        if (isAuthenticated) {
            fetchAlerts();

            const intervalId = setInterval(() => {
                fetchAlerts();
            }, 60000); // Check every minute

            // Clean up interval when component unmounts or auth status changes
            return () => clearInterval(intervalId);
        }
    }, [isAuthenticated]); // Re-run effect when auth status changes

    const markAsRead = async (alertId) => {
        try {
            await alertsService.markAsRead(alertId);
            setAlerts(prevAlerts =>
                prevAlerts.map(alert =>
                    alert.id === alertId ? { ...alert, read: true } : alert
                )
            );
            calculateUnreadCount(alerts.map(alert =>
                alert.id === alertId ? { ...alert, read: true } : alert
            ));
            return true;
        } catch (error) {
            console.error('Error marking alert as read:', error);
            return false;
        }
    };

    const markAllAsRead = async () => {
        try {
            await alertsService.markAllAsRead();
            setAlerts(prevAlerts =>
                prevAlerts.map(alert => ({ ...alert, read: true }))
            );
            setUnreadCount(0);
            return true;
        } catch (error) {
            console.error('Error marking all alerts as read:', error);
            return false;
        }
    };

    const getFilteredAlerts = (filter) => {
        if (filter === 'all') {
            return alerts;
        } else if (filter === 'unread') {
            return alerts.filter(alert => !alert.read);
        } else {
            return alerts.filter(alert => alert.type === filter);
        }
    };

    const value = {
        alerts,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        getFilteredAlerts,
        refreshAlerts: fetchAlerts
    };

    return (
        <AlertContext.Provider value={value}>
            {children}
        </AlertContext.Provider>
    );
};

export const useAlerts = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlerts must be used within an AlertProvider');
    }
    return context;
};