import React from 'react';

const AlertFilter = ({ activeFilter, onFilterChange }) => {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            <button
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activeFilter === 'all' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                    }`}
                onClick={() => onFilterChange('all')}
            >
                All
            </button>
            <button
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activeFilter === 'unread' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                    }`}
                onClick={() => onFilterChange('unread')}
            >
                Unread
            </button>
            <button
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activeFilter === 'work-order' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                    }`}
                onClick={() => onFilterChange('work-order')}
            >
                Work Orders
            </button>
            <button
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activeFilter === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}
                onClick={() => onFilterChange('urgent')}
            >
                Urgent
            </button>
            <button
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activeFilter === 'status-change' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}
                onClick={() => onFilterChange('status-change')}
            >
                Status
            </button>
            <button
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activeFilter === 'completion' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                onClick={() => onFilterChange('completion')}
            >
                Completed
            </button>
        </div>
    );
};

export default AlertFilter;