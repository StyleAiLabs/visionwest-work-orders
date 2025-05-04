import React from 'react';

const StatusRadioGroup = ({ status, onStatusChange }) => {
    return (
        <div className="space-y-3">
            <label className={`flex items-center p-3 border rounded-md ${status === 'pending' ? 'bg-amber-50 border-amber-300' : 'hover:bg-amber-50'
                }`}>
                <input
                    type="radio"
                    name="status"
                    value="pending"
                    checked={status === 'pending'}
                    onChange={() => onStatusChange('pending')}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                />
                <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Pending</span>
                    <p className="text-xs text-gray-500">Work order received but not started</p>
                </div>
            </label>

            <label className={`flex items-center p-3 border rounded-md ${status === 'in-progress' ? 'bg-vw-green-light border-vw-green' : 'hover:bg-vw-green-light'
                }`}>
                <input
                    type="radio"
                    name="status"
                    value="in-progress"
                    checked={status === 'in-progress'}
                    onChange={() => onStatusChange('in-progress')}
                    className="h-4 w-4 text-vw-green focus:ring-vw-green"
                />
                <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">In Progress</span>
                    <p className="text-xs text-gray-500">Work has started but not completed</p>
                </div>
            </label>

            <label className={`flex items-center p-3 border rounded-md ${status === 'completed' ? 'bg-green-50 border-green-300' : 'hover:bg-green-50'
                }`}>
                <input
                    type="radio"
                    name="status"
                    value="completed"
                    checked={status === 'completed'}
                    onChange={() => onStatusChange('completed')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Completed</span>
                    <p className="text-xs text-gray-500">All work has been finished</p>
                </div>
            </label>
        </div>
    );
};

export default StatusRadioGroup;