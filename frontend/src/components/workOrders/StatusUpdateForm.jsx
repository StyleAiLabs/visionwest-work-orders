import React from 'react';

const StatusUpdateForm = ({ currentStatus, onStatusChange }) => {
    return (
        <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
            <div className="flex gap-2">
                <button
                    className={`flex-1 font-medium py-2 px-3 rounded-md text-sm border-2 ${currentStatus === 'pending'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-white text-amber-800 border-gray-300'
                        }`}
                    onClick={() => onStatusChange('pending')}
                >
                    Pending
                </button>
                <button
                    className={`flex-1 font-medium py-2 px-3 rounded-md text-sm border-2 ${currentStatus === 'in-progress'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-white text-blue-800 border-gray-300'
                        }`}
                    onClick={() => onStatusChange('in-progress')}
                >
                    In Progress
                </button>
                <button
                    className={`flex-1 font-medium py-2 px-3 rounded-md text-sm border-2 ${currentStatus === 'completed'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-white text-green-800 border-gray-300'
                        }`}
                    onClick={() => onStatusChange('completed')}
                >
                    Completed
                </button>
            </div>
        </div>
    );
};

export default StatusUpdateForm;