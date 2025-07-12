import React, { useState, useEffect } from 'react';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import { useNavigate, useLocation } from 'react-router-dom';
import AlertItem from '../components/alerts/AlertItem';
import AlertFilter from '../components/alerts/AlertFilter';
import { useAlerts } from '../context/AlertContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AlertsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        alerts,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        getFilteredAlerts
    } = useAlerts();

    const [activeFilter, setActiveFilter] = useState('all');
    const [filteredAlerts, setFilteredAlerts] = useState([]);

    // Check URL parameters for filter
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const filterParam = params.get('filter');
        if (filterParam) {
            setActiveFilter(filterParam);
        }
    }, [location.search]);

    // Apply filters
    useEffect(() => {
        setFilteredAlerts(getFilteredAlerts(activeFilter));
    }, [activeFilter, alerts, getFilteredAlerts]);

    // Handle mark as read
    const handleMarkAsRead = async (id) => {
        await markAsRead(id);
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 pb-16 pt-16">
            <AppHeader
                title={`Alerts ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
                showBackButton={true}
                onBackClick={() => navigate('/dashboard')}
                rightContent={
                    unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="bg-amber-400 hover:bg-amber-500 text-white text-xs font-medium py-1 px-2 rounded"
                        >
                            Mark All Read
                        </button>
                    )
                }
            />

            <div className="bg-white p-3 shadow">
                <AlertFilter
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 bg-white rounded-lg shadow p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-gray-600">No alerts found</p>
                        {activeFilter !== 'all' && (
                            <button
                                className="mt-2 text-blue-600 text-sm"
                                onClick={() => setActiveFilter('all')}
                            >
                                View all alerts
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredAlerts.map((alert) => (
                            <AlertItem
                                key={alert.id}
                                alert={alert}
                                onMarkAsRead={handleMarkAsRead}
                            />
                        ))}
                    </div>
                )}
            </div>

            <MobileNavigation />
        </div>
    );
};

export default AlertsPage;