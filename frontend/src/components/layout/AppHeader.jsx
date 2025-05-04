import React from 'react';
import visionwestLogo from '../../assets/visionwest-logo.png';

const AppHeader = ({ title, showBackButton = false, onBackClick, rightContent }) => {
    return (
        <div className="bg-vw-dark text-white p-4 flex items-center justify-between">
            <div className="flex items-center">
                {showBackButton && (
                    <button
                        onClick={onBackClick}
                        className="mr-2"
                        aria-label="Go back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                )}
                {title === "Dashboard" ? (
                    <img src={visionwestLogo} alt="VisionWest Logo" className="h-8" />
                ) : (
                    <h2 className="text-xl font-bold">{title}</h2>
                )}
            </div>

            {rightContent && (
                <div className="flex gap-2">
                    {rightContent}
                </div>
            )}
        </div>
    );
};

export default AppHeader;