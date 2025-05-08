import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const StatusRadioGroup = ({ status, onStatusChange }) => {
    const { user } = useAuth();
    const isClient = user && user.role === 'client';

    // For clients, only show cancel option if the order is not already completed
    const showCancelOption = isClient && status !== 'completed' && status !== 'cancelled';

    // For staff/admin, show regular options
    const showRegularOptions = !isClient;

    return (
        <div className="space-y-3">
            {/* Regular status options - only shown to staff/admin users */}
            {showRegularOptions && (
                <>
                    <label className={`flex items-center p-3 border rounded-md ${status === 'pending' ? 'bg-amber-50 border-amber-300' : 'hover:bg-amber-50'}`}>
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

                    <label className={`flex items-center p-3 border rounded-md ${status === 'in-progress' ? 'bg-vw-green-light border-vw-green' : 'hover:bg-vw-green-light'}`}>
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

                    <label className={`flex items-center p-3 border rounded-md ${status === 'completed' ? 'bg-green-50 border-green-300' : 'hover:bg-green-50'}`}>
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
                </>
            )}

            {/* Cancel option - only shown to clients for non-completed/cancelled orders */}
            {showCancelOption && (
                <label className={`flex items-center p-3 border rounded-md ${status === 'cancelled' ? 'bg-red-50 border-red-300' : 'hover:bg-red-50'}`}>
                    <input
                        type="radio"
                        name="status"
                        value="cancelled"
                        checked={status === 'cancelled'}
                        onChange={() => onStatusChange('cancelled')}
                        className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Cancel Work Order</span>
                        <p className="text-xs text-gray-500">Request this work order to be cancelled</p>
                    </div>
                </label>
            )}

            {/* Display current status for clients when already completed/cancelled */}
            {isClient && status === 'completed' && (
                <div className="p-3 border rounded-md bg-green-50 border-green-300">
                    <div className="flex items-center">
                        <div className="h-4 w-4 bg-green-600 rounded-full mr-3"></div>
                        <div>
                            <span className="text-sm font-medium text-gray-900">Completed</span>
                            <p className="text-xs text-gray-500">This work order has been marked as complete</p>
                        </div>
                    </div>
                </div>
            )}

            {isClient && status === 'cancelled' && (
                <div className="p-3 border rounded-md bg-red-50 border-red-300">
                    <div className="flex items-center">
                        <div className="h-4 w-4 bg-red-600 rounded-full mr-3"></div>
                        <div>
                            <span className="text-sm font-medium text-gray-900">Cancelled</span>
                            <p className="text-xs text-gray-500">This work order has been cancelled</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusRadioGroup;