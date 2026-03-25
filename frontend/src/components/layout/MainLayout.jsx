import React, { useState, useEffect } from 'react';
import MobileNavigation from './MobileNavigation';
import DesktopSidebar from './DesktopSidebar';

const STORAGE_KEY = 'wom-sidebar-open';

const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored !== null ? stored === 'true' : true; // default open
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(sidebarOpen));
    }, [sidebarOpen]);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop sidebar */}
            <DesktopSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

            {/* Main content — shifts right on desktop when sidebar is open */}
            <div
                className={`pb-16 lg:pb-0 transition-[margin] duration-300 ease-in-out ${
                    sidebarOpen ? 'lg:ml-[240px]' : 'lg:ml-0'
                }`}
            >
                {children}
            </div>

            {/* Mobile bottom nav */}
            <MobileNavigation />
        </div>
    );
};

export { STORAGE_KEY };
export default MainLayout;
