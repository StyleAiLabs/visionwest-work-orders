import React from 'react';

const StatusBadge = ({ status }) => {
    const statusStyles = {
        pending: 'bg-amber-100 text-amber-800 border-amber-300',
        'in-progress': 'bg-vw-green-light text-vw-dark border-vw-green',
        completed: 'bg-green-50 text-green-800 border-green-300',
        cancelled: 'bg-red-100 text-red-800 border-red-300'
    };

    const statusDisplay = {
        pending: 'Pending',
        'in-progress': 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.pending}`}>
            {statusDisplay[status] || 'Unknown'}
        </span>
    );
};

export default StatusBadge;