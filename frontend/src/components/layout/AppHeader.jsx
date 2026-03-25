import React from 'react';
import nextgenLogo from '../../assets/nextgen-logo.png';
import { useSidebar } from '../../hooks/useSidebar';

const AppHeader = ({ title, showBackButton = false, onBackClick, rightContent }) => {
    const { isOpen, open } = useSidebar();

    return (
        <header
            className={`bg-deep-navy text-pure-white fixed top-0 left-0 right-0 z-[9999] shadow-lg transition-[left] duration-300 ease-in-out ${
                isOpen ? 'lg:left-[240px]' : 'lg:left-0'
            }`}
            style={{ height: '64px', padding: '16px' }}
        >
            {/* Left side: hamburger toggle (desktop, when sidebar closed) + back button */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                {!isOpen && (
                    <button
                        onClick={open}
                        className="hidden lg:block p-1 rounded-full hover:bg-deep-navy-light transition-colors"
                        aria-label="Open sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}

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

            {/* Title */}
            <div
                className={`flex items-center h-full ${showBackButton ? 'justify-center' : 'justify-start'}`}
                style={{ paddingLeft: (!isOpen || showBackButton) ? '40px' : '0' }}
            >
                {title === "Dashboard" ? (
                    <img src={nextgenLogo} alt="NextGen WOM" className="h-8" />
                ) : (
                    <h1 className="text-lg font-semibold truncate">{title}</h1>
                )}
            </div>

            {/* Right-aligned action buttons */}
            {rightContent && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                    {rightContent}
                </div>
            )}
        </header>
    );
};

export default AppHeader;
