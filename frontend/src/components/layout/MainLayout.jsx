import React from 'react';
import MobileNavigation from './MobileNavigation';
import DesktopSidebar from './DesktopSidebar';

const MainLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop sidebar */}
            <DesktopSidebar />

            {/* Main content — shifts right on desktop */}
            <div className="lg:ml-[240px] pb-16 lg:pb-0">
                {children}
            </div>

            {/* Mobile bottom nav */}
            <MobileNavigation />
        </div>
    );
};

export default MainLayout;
