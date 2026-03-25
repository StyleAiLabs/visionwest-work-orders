import React from 'react';
import MobileNavigation from './MobileNavigation';
import DesktopSidebar from './DesktopSidebar';
import { useSidebar } from '../../hooks/useSidebar';

const MainLayout = ({ children }) => {
    const { isOpen } = useSidebar();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop sidebar — fixed, slides in/out */}
            <DesktopSidebar />

            {/* Main content — shifts right on desktop when sidebar is open */}
            <div
                className={`pb-16 lg:pb-0 transition-[margin] duration-300 ease-in-out ${
                    isOpen ? 'lg:ml-[240px]' : 'lg:ml-0'
                }`}
            >
                {children}
            </div>

            {/* Mobile bottom nav — hidden on desktop */}
            <MobileNavigation />
        </div>
    );
};

export default MainLayout;
