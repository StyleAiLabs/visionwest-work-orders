import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import SummaryCard from '../components/dashboard/SummaryCard';
import ActivityItem from '../components/dashboard/ActivityItem';
import QuickActionButton from '../components/dashboard/QuickActionButton';
import { useAuth } from '../hooks/useAuth';
import { alertsService } from '../services/alertsService';
import { dashboardService } from '../services/dashboardService';

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0,
        total: 0
    });
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch dashboard summary
                const summaryData = await dashboardService.getDashboardSummary();
                setSummary(summaryData.data);

                // Fetch unread alerts count
                const alertsCount = await alertsService.getUnreadCount();
                setUnreadAlertsCount(alertsCount);

                // Fetch recent activities
                const recentActivities = await dashboardService.getRecentActivities();
                const formattedActivities = recentActivities.data.map(activity => ({
                    id: activity.id,
                    type: getActivityType(activity.status),
                    message: `Job #${activity.jobNo} - ${getActivityMessage(activity.status)}`,
                    details: activity.property,
                    time: formatDate(activity.date)
                }));
                setActivities(formattedActivities);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getActivityType = (status) => {
        switch (status) {
            case 'pending': return 'new';
            case 'in-progress': return 'status-change';
            case 'completed': return 'completed';
            default: return 'status-change';
        }
    };

    const getActivityMessage = (status) => {
        switch (status) {
            case 'pending': return 'New work order created';
            case 'in-progress': return 'Status updated to In Progress';
            case 'completed': return 'Work order completed';
            default: return 'Status updated';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-NZ', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Header right content with notification and profile buttons
    const headerRightContent = (
        <>
            <button
                className="p-1 rounded-full hover:bg-vw-green relative"
                onClick={() => navigate('/alerts')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadAlertsCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                    </div>
                )}
            </button>
            <button
                className="p-1 rounded-full hover:bg-vw-green"
                onClick={() => navigate('/settings')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
        </>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <AppHeader
                    title="Dashboard"
                    rightContent={headerRightContent}
                />
                <div className="flex-1 p-4">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <p className="text-red-700">{error}</p>
                        <button
                            className="mt-2 text-red-700 underline"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
                <MobileNavigation />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 pb-16">
            <AppHeader
                title="Dashboard"
                rightContent={headerRightContent}
            />

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <SummaryCard title="Pending" value={summary.pending} color="orange" />
                    <SummaryCard title="In Progress" value={summary.inProgress} color="blue" />
                    <SummaryCard title="Completed" value={summary.completed} color="green" />
                    <SummaryCard title="Cancelled" value={summary.cancelled} color="red" />
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">Recent Activity</h3>
                        {unreadAlertsCount > 0 && (
                            <button
                                onClick={() => navigate('/alerts')}
                                className="text-blue-600 text-sm font-medium flex items-center"
                            >
                                View All ({unreadAlertsCount} new)
                            </button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {activities.map(activity => (
                            <ActivityItem
                                key={activity.id}
                                type={activity.type}
                                message={activity.message}
                                details={activity.details}
                                time={activity.time}
                            />
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <QuickActionButton
                            to="/work-orders"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            }
                            label="View All"
                        />
                        <QuickActionButton
                            to="/work-orders?status=pending"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            }
                            label="Pending"
                        />
                        <QuickActionButton
                            to="/work-orders?date=today"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            }
                            label="Today"
                        />
                        <QuickActionButton
                            to="/alerts?filter=urgent"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            }
                            label="Urgent"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <MobileNavigation />
        </div>
    );
};

export default DashboardPage;