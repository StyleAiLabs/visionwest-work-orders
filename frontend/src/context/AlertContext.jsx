import React, { createContext, useState, useEffect, useContext } from 'react';
import { alertsService } from '../services/alertsService';

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            setIsLoading(true);
            const response = await alertsService.getAlerts();
            setAlerts(response.data);
            calculateUnreadCount(response.data);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateUnreadCount = (alertsData) => {
        const count = alertsData.filter(alert => !alert.read).length;
        setUnreadCount(count);
    };

    useEffect(() => {
        fetchAlerts();

        // Set up periodic checks for new alerts
        const intervalId = setInterval(() => {
            fetchAlerts();
        }, 60000); // Check every minute

        return () => clearInterval(intervalId);
    }, []);

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