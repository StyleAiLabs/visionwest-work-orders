import React from 'react';
import visionwestLogo from '../../assets/visionwest-logo-header.png';

const AppHeader = ({ title, showBackButton = false, onBackClick, rightContent }) => {
    return (
        <div className="bg-vw-dark text-white p-4 relative">
            {/* Left-aligned back button */}
            {showBackButton && (
                <button
                    onClick={onBackClick}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
                    aria-label="Go back"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
            )}

            {/* Title with proper spacing for back button */}
            <div className={`flex justify-left items-center ${showBackButton ? 'ml-10' : ''}`}>
                {title === "Dashboard" ? (
                    <img src={visionwestLogo} alt="VisionWest Logo" className="h-8" />
                ) : (
                    <h2 className="text-xl font-bold">{title}</h2>
                )}
            </div>

            {/* Right-aligned action buttons */}
            {rightContent && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex gap-2">
                    {rightContent}
                </div>
            )}
        </div>
    );
};

export default AppHeader;