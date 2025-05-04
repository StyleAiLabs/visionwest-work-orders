import React from 'react';
import { Link } from 'react-router-dom';

const AlertItem = ({ alert, onMarkAsRead }) => {
    const getIconByType = (type) => {
        switch (type) {
            case 'work-order':
                return (
                    <div className="bg-blue-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                );
            case 'status-change':
                return (
                    <div className="bg-purple-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                );
            case 'completion':
                return (
                    <div className="bg-green-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'urgent':
                return (
                    <div className="bg-red-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="bg-gray-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div
            className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${alert.read ? 'bg-white border-gray-200' : 'bg-yellow-50 border-yellow-400'}`}
        >
            {getIconByType(alert.type)}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                    <p className={`text-sm font-medium ${alert.read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {alert.title}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{alert.time}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                {alert.workOrderId && (
                    <div className="mt-2">
                        <Link
                            to={`/work-orders/${alert.workOrderId}`}
                            className="text-xs text-blue-600 font-medium"
                        >
                            View Work Order →
                        </Link>
                    </div>
                )}
            </div>
            {!alert.read && (
                <button
                    onClick={() => onMarkAsRead(alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Mark as read"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default AlertItem;