import React from 'react';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import { useNavigate } from 'react-router-dom';

const AlertsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 pb-16">
            <AppHeader
                title="Alerts"
                showBackButton={true}
                onBackClick={() => navigate(-1)}
            />

            <div className="flex-1 p-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-medium mb-2">Alerts</h2>
                    <p className="text-gray-600">Alerts functionality coming soon...</p>
                </div>
            </div>

            <MobileNavigation />
        </div>
    );
};

export default AlertsPage;