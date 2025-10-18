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
        <div className="grid grid-cols-5 gap-1 py-2">
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