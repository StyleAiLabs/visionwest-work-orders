import React from 'react';
import { formatDate } from '../../utils/dateHelpers';
import StatusBadge from '../common/StatusBadge';

const WorkOrderCard = ({ workOrder, onClick }) => {
    // Format address into a single line
    const formatAddress = (workOrder) => {
        const address = workOrder.property_address || workOrder.propertyAddress;
        if (!address) return 'Address not available';

        // If address is too long, truncate it
        return address.length > 50 ? `${address.substring(0, 47)}...` : address;
    };

    return (
        <div
            className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={onClick}
        >
            {/* Header with Job Number and Status */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                    #{workOrder.job_no || workOrder.jobNo}
                </h3>
                <StatusBadge status={workOrder.status} />
            </div>

            {/* Property Info */}
            <div className="space-y-2 mb-3">
                <div>
                    <h4 className="font-medium text-gray-800 text-base">
                        {workOrder.property_name || workOrder.propertyName}
                    </h4>
                    <p className="text-sm text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {formatAddress(workOrder)}
                    </p>
                </div>

                {/* Work Description */}
                <div>
                    <p className="text-sm text-gray-700">
                        {workOrder.work_description || workOrder.workDescription || 'No description available'}
                    </p>
                </div>
            </div>

            {/* Footer with Date and Supplier */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 6h6M6 10h12M6 14h12M6 18h12" />
                    </svg>
                    {formatDate(workOrder.created_at || workOrder.createdAt)}
                </div>
                <div className="flex items-center">
                    <span className="mr-2">{workOrder.supplier_name || workOrder.supplierName || 'VisionWest'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderCard;