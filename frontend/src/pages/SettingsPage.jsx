import React from 'react';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

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