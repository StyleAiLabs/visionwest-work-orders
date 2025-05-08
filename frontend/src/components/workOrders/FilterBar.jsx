import React from 'react';

const FilterBar = ({ activeFilter, onFilterChange }) => {
    const filters = [
        { id: '', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'in-progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' }
    ];

    return (
        <div className="flex gap-2 overflow-x-auto py-2">
            {filters.map(filter => (
                <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                        ${activeFilter === filter.id
                            ? filter.id === 'cancelled'
                                ? 'bg-red-600 text-white'
                                : 'bg-vw-green text-white'
                            : 'bg-white text-gray-600 border border-gray-300'}`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
};

export default FilterBar;