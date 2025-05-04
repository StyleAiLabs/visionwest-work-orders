import React from 'react';

const LoadingSpinner = ({ size = 'medium' }) => {
    const sizeClasses = {
        small: 'h-6 w-6',
        medium: 'h-12 w-12',
        large: 'h-16 w-16'
    };

    return (
        <div className="flex justify-center items-center">
            <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-2 border-b-2 border-vw-green`}></div>
        </div>
    );
};

export default LoadingSpinner;