import React from 'react';
import visionwestLogo from '../../assets/visionwest-logo-header.png';

const AppHeader = ({ title, showBackButton = false, onBackClick, rightContent }) => {
    return (
        <header
            className="bg-gray-900 text-white fixed top-0 left-0 right-0 z-[9999] shadow-lg"
            style={{
                height: '64px',
                padding: '16px',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999
            }}
        >
            {/* Left-aligned back button */}
            {showBackButton && (
                <button
                    onClick={onBackClick}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-1 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label="Go back"
                    style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
            )}

            {/* Title - centered when back button is present, left-aligned otherwise */}
            <div
                className={`flex items-center h-full ${showBackButton ? 'justify-center' : 'justify-start'}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: showBackButton ? 'center' : 'flex-start'
                }}
            >
                {title === "Dashboard" ? (
                    <img src={visionwestLogo} alt="VisionWest Logo" className="h-8" />
                ) : (
                    <h1 className="text-lg font-semibold truncate" style={{ fontSize: '18px', fontWeight: '600' }}>
                        {title}
                    </h1>
                )}
            </div>

            {/* Right-aligned action buttons */}
            {rightContent && (
                <div
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 flex gap-2"
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}
                >
                    {rightContent}
                </div>
            )}
        </header>
    );
};

export default AppHeader;