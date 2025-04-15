import React from 'react';

const ActivityItem = ({ type, message, details, time }) => {
    const borderColors = {
        'status-change': 'border-blue-500',
        'completed': 'border-green-500',
        'new': 'border-amber-500',
    };

    return (
        <div className={`border-l-4 ${borderColors[type] || 'border-gray-300'} pl-3 py-1`}>
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-gray-500">{details} • {time}</p>
        </div>
    );
};

export default ActivityItem;