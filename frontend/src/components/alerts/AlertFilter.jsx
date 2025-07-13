import React from 'react';

const AlertFilter = ({ activeFilter, onFilterChange }) => {
    const filters = [
        {
            id: 'all',
            label: 'All',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            )
        },
        {
            id: 'unread',
            label: 'Unread',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        },
        {
            id: 'work-order',
            label: 'Work Orders',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            )
        },
        {
            id: 'urgent',
            label: 'Urgent',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        {
            id: 'status-change',
            label: 'Status',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m3 0v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4h16zM9 9l2 2 4-4" />
                </svg>
            )
        },
        {
            id: 'completion',
            label: 'Completed',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ];

    const getFilterColors = (filterId, isActive) => {
        if (isActive) {
            switch (filterId) {
                case 'all':
                    return 'bg-gray-800 text-white';
                case 'unread':
                    return 'bg-yellow-600 text-white';
                case 'work-order':
                    return 'bg-blue-600 text-white';
                case 'urgent':
                    return 'bg-red-600 text-white';
                case 'status-change':
                    return 'bg-purple-600 text-white';
                case 'completion':
                    return 'bg-green-600 text-white';
                default:
                    return 'bg-gray-800 text-white';
            }
        } else {
            switch (filterId) {
                case 'unread':
                    return 'bg-white text-yellow-600 border border-yellow-200';
                case 'work-order':
                    return 'bg-white text-blue-600 border border-blue-200';
                case 'urgent':
                    return 'bg-white text-red-600 border border-red-200';
                case 'status-change':
                    return 'bg-white text-purple-600 border border-purple-200';
                case 'completion':
                    return 'bg-white text-green-600 border border-green-200';
                default:
                    return 'bg-white text-gray-600 border border-gray-300';
            }
        }
    };

    return (
        <div className="grid grid-cols-6 gap-1">
            {filters.map(filter => (
                <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={`p-3 rounded-full flex items-center justify-center transition-colors duration-200 ${getFilterColors(filter.id, activeFilter === filter.id)}`}
                    title={filter.label}
                >
                    {filter.icon}
                </button>
            ))}
        </div>
    );
};

export default AlertFilter;