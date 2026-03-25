import React, { useState, useEffect } from 'react';
import nextgenLogo from '../../assets/nextgen-logo.png';

const STORAGE_KEY = 'wom-sidebar-open';

const AppHeader = ({ title, showBackButton = false, onBackClick, rightContent }) => {
    // Read sidebar state to position header and show toggle
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored !== null ? stored === 'true' : true;
    });

    // Listen for sidebar state changes from MainLayout
    useEffect(() => {
        const handleStorage = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            setSidebarOpen(stored === 'true');
        };
        window.addEventListener('storage', handleStorage);

        // Also poll for same-tab changes (storage event only fires cross-tab)
        const interval = setInterval(() => {
            const stored = localStorage.getItem(STORAGE_KEY);
            setSidebarOpen(stored === 'true');
        }, 100);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, []);

    const toggleSidebar = () => {
        const newValue = !sidebarOpen;
        setSidebarOpen(newValue);
        localStorage.setItem(STORAGE_KEY, String(newValue));
    };

    return (
        <header
            className={`bg-deep-navy text-pure-white fixed top-0 left-0 right-0 z-[9999] shadow-lg transition-[left] duration-300 ease-in-out ${
                sidebarOpen ? 'lg:left-[240px]' : 'lg:left-0'
            }`}
            style={{
                height: '64px',
                padding: '16px',
            }}
        >
            {/* Left side: hamburger toggle (desktop) or back button */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                {/* Hamburger toggle — desktop only, shown when sidebar is closed */}
                {!sidebarOpen && (
                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:block p-1 rounded-full hover:bg-deep-navy-light transition-colors"
                        aria-label="Open sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}

                {/* Back button */}
                {showBackButton && (
                    <button
                        onClick={onBackClick}
                        className="p-1 rounded-full hover:bg-deep-navy-light transition-colors"
                        aria-label="Go back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Title - centered when back button is present, left-aligned otherwise */}
            <div
                className={`flex items-center h-full ${showBackButton ? 'justify-center' : 'justify-start'}`}
                style={{
                    paddingLeft: (!sidebarOpen || showBackButton) ? '40px' : '0',
                }}
            >
                {title === "Dashboard" ? (
                    <img src={nextgenLogo} alt="NextGen WOM" className="h-8" />
                ) : (
                    <h1 className="text-lg font-semibold truncate">
                        {title}
                    </h1>
                )}
            </div>

            {/* Right-aligned action buttons */}
            {rightContent && (
                <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2"
                >
                    {rightContent}
                </div>
            )}
        </header>
    );
};

export default AppHeader;
