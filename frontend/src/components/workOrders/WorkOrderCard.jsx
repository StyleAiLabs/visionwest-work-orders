import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const WorkOrderCard = ({ workOrder, onClick }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        try {
            if (!dateString) return 'Date unavailable';
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) return 'Invalid date';
            return `Created ${formatDistanceToNow(date)} ago`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Date unavailable';
        }
    };

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">#{workOrder.job_no}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(workOrder.status)}`}>
                    {workOrder.status}
                </span>
            </div>

            <p className="text-gray-600 text-sm mb-2">{workOrder.property}</p>
            <p className="text-gray-500 text-sm mb-3">{workOrder.description}</p>

            <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{formatDate(workOrder.created_at)}</span>
                {workOrder.photos_count > 0 && (
                    <span>{workOrder.photos_count} photos</span>
                )}
            </div>
        </div>
    );
};

export default WorkOrderCard;