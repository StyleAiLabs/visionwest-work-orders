import React from 'react';

const DetailItem = ({ label, value, icon }) => {
    return (
        <div className="space-y-1">
            <div className="flex items-center space-x-2">
                {icon && (
                    <span className="text-gray-400 text-sm">{icon}</span>
                )}
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-sm text-gray-900 font-medium">
                {value || 'N/A'}
            </div>
        </div>
    );
};

export default DetailItem;