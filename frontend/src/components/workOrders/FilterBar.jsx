import React from 'react';

const FilterBar = ({ activeFilter, onFilterChange }) => {
    const filters = [
        {
            id: '',
            label: 'All',
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
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            id: 'pending',
            label: 'Pending',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'in-progress',
            label: 'In Progress',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        {
            id: 'completed',
            label: 'Completed',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'cancelled',
            label: 'Cancelled',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ];

    const getFilterColors = (filterId, isActive) => {
        if (isActive) {
            switch (filterId) {
                case 'urgent':
                    return 'bg-red-600 text-white';
                case 'pending':
                    return 'bg-orange-600 text-white';
                case 'in-progress':
                    return 'bg-deep-navy text-pure-white';
                case 'completed':
                    return 'bg-nextgen-green text-pure-white';
                case 'cancelled':
                    return 'bg-red-600 text-white';
                default:
                    return 'bg-nextgen-green text-pure-white';
            }
        } else {
            switch (filterId) {
                case 'urgent':
                    return 'bg-white text-red-600 border border-red-200';
                case 'pending':
                    return 'bg-white text-orange-600 border border-orange-200';
                case 'in-progress':
                    return 'bg-pure-white text-deep-navy border border-deep-navy/20';
                case 'completed':
                    return 'bg-pure-white text-nextgen-green border border-nextgen-green/20';
                case 'cancelled':
                    return 'bg-white text-red-600 border border-red-200';
                default:
                    return 'bg-white text-gray-600 border border-gray-300';
            }
        }
    };

    return (
        <div className="grid grid-cols-6 gap-1 py-2">
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

export default FilterBar;