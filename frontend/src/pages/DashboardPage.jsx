import React, { useState, useEffect } from 'react';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import SummaryCard from '../components/dashboard/SummaryCard';
import ActivityItem from '../components/dashboard/ActivityItem';
import QuickActionButton from '../components/dashboard/QuickActionButton';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const DashboardPage = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0,
        total: 0
    });
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Mock data loading - replace with actual API calls later
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // In a real implementation, these would be actual API calls
                // const summaryData = await api.get('/work-orders/summary');
                // const activitiesData = await api.get('/activities');

                // Mock data for development
                const mockSummary = {
                    pending: 8,
                    inProgress: 5,
                    completed: 12,
                    total: 25
                };

                const mockActivities = [
                    {
                        id: 1,
                        type: 'status-change',
                        message: 'Status changed to "In Progress"',
                        details: 'Job #RBWO010965',
                        time: '2h ago'
                    },
                    {
                        id: 2,
                        type: 'completed',
                        message: 'Work order completed',
                        details: 'Job #RBWO010932',
                        time: '5h ago'
                    },
                    {
                        id: 3,
                        type: 'new',
                        message: 'New work order assigned',
                        details: 'Job #RBWO010980',
                        time: '8h ago'
                    }
                ];

                setSummary(mockSummary);
                setActivities(mockActivities);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Header right content with notification and profile buttons
    const headerRightContent = (
        <>
            <button className="p-1 rounded-full hover:bg-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </button>
            <button className="p-1 rounded-full hover:bg-indigo-500">
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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 pb-16">
            <AppHeader
                title="Dashboard"
                rightContent={headerRightContent}
            />

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <SummaryCard title="Pending" value={summary.pending} color="orange" />
                    <SummaryCard title="In Progress" value={summary.inProgress} color="blue" />
                    <SummaryCard title="Completed" value={summary.completed} color="green" />
                    <SummaryCard title="Total" value={summary.total} color="indigo" />
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
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
                            to="/work-orders?sort=latest"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            }
                            label="Latest"
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