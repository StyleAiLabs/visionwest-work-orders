import React from 'react';
import { format } from 'date-fns';

const WorkOrderCard = ({ workOrder, onClick }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-800';
            case 'in-progress': return 'bg-vw-green-light text-vw-dark';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        try {
            if (!dateString) return '';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return format(date, 'dd MMM yyyy');
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    };

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(workOrder.status)}`}>
                        {workOrder.status.charAt(0).toUpperCase() + workOrder.status.slice(1)}
                    </span>
                    <span className="text-gray-400 text-sm">{formatDate(workOrder.date)}</span>
                </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">Job #{workOrder.jobNo}</h3>
            <p className="text-gray-700 text-sm mb-2">{workOrder.property?.name || workOrder.property}</p>
            <p className="text-gray-600 text-sm line-clamp-2">{workOrder.description}</p>

            <div className="flex items-center justify-between mt-3">
                <span className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {workOrder.supplier?.name || 'Unassigned'}
                </span>
                <span className="text-vw-green text-sm font-medium">View details →</span>
            </div>
        </div>
    );
};

export default WorkOrderCard;