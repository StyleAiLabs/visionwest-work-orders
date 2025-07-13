import React, { useState, useEffect } from 'react';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import { appService } from '../services/appService';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [appInfo, setAppInfo] = useState(null);
    const [isLoadingAppInfo, setIsLoadingAppInfo] = useState(true);

    useEffect(() => {
        const fetchAppInfo = async () => {
            try {
                const response = await appService.getAppInfo();
                setAppInfo(response.data);
            } catch (error) {
                console.error('Error fetching app info:', error);
                // Fallback to static version if API fails
                setAppInfo({
                    version: '2.3.0',
                    name: 'VisionWest Work Orders'
                });
            } finally {
                setIsLoadingAppInfo(false);
            }
        };

        fetchAppInfo();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AppHeader
                title="Settings"
                showBackButton={true}
                onBackClick={() => navigate(-1)}
            />

            <div className="pt-16 pb-16 p-4">
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <h2 className="text-lg font-medium mb-2">Account</h2>
                    {user && (
                        <div className="text-gray-600">
                            <p>Name: {user.name || 'User'}</p>
                            <p>Email: {user.email || 'user@example.com'}</p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <h2 className="text-lg font-medium mb-2">Preferences</h2>
                    <p className="text-gray-600">Preferences settings coming soon...</p>
                </div>

                {/* App Information Section */}
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <h2 className="text-lg font-medium mb-3">App Information</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Version</span>
                            {isLoadingAppInfo ? (
                                <div className="w-16 h-4 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <span className="font-medium text-gray-900">{appInfo?.version || '2.3.0'}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Application</span>
                            <span className="font-medium text-gray-900">VisionWest Work Orders</span>
                        </div>
                        <button
                            onClick={() => navigate('/release-notes')}
                            className="w-full mt-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-md text-sm transition-colors duration-200 flex items-center justify-between"
                        >
                            <span>View Release Notes</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <Button
                    variant="dark"
                    fullWidth
                    onClick={handleLogout}
                >
                    Sign Out
                </Button>
            </div>

            <MobileNavigation />
        </div>
    );
};

export default SettingsPage;