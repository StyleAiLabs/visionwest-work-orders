import React from 'react';
import { formatDate } from '../../utils/dateHelpers';
import StatusBadge from '../common/StatusBadge';
import CompactExportButton from '../common/CompactExportButton';

const WorkOrderCard = ({ workOrder, onClick }) => {
    // Format address into a single line
    const formatAddress = (workOrder) => {
        // Check for actual address fields, fallback to property name if needed
        const address = workOrder.property_address ||
            workOrder.propertyAddress ||
            workOrder.property?.address ||
            workOrder.property_name ||
            workOrder.propertyName;

        if (!address) return 'Address not available';

        // If address is too long, truncate it
        return address.length > 50 ? `${address.substring(0, 47)}...` : address;
    };

    // Enhanced date formatting to handle database format
    const formatWorkOrderDate = (workOrder) => {
        // Debug: Log all available fields in the work order object
        console.log('=== WORK ORDER DEBUG ===');
        console.log('Full work order object:', workOrder);
        console.log('Object keys:', Object.keys(workOrder));

        // Check multiple possible date field names
        const dateValue = workOrder.createdAt ||
            workOrder.created_at ||
            workOrder.date ||
            workOrder.created_date ||
            workOrder.createdDate ||
            workOrder.updatedAt ||
            workOrder.updated_at;

        // Debug: Log specific date fields
        console.log('Date field values:', {
            createdAt: workOrder.createdAt,
            created_at: workOrder.created_at,
            date: workOrder.date,
            created_date: workOrder.created_date,
            createdDate: workOrder.createdDate,
            updatedAt: workOrder.updatedAt,
            updated_at: workOrder.updated_at
        });

        if (!dateValue) {
            console.log('No date value found for work order:', workOrder.id);
            return 'Date not available';
        }

        try {
            console.log('Found date value:', dateValue, 'Type:', typeof dateValue);

            // Handle the database format: 2025-06-29 23:30:08.492 +1200
            let dateToFormat = dateValue;

            // If the date string contains timezone offset but not in ISO format
            if (typeof dateValue === 'string' && dateValue.includes('+') && !dateValue.includes('T')) {
                // Convert "2025-06-29 23:30:08.492 +1200" to ISO format
                const parts = dateValue.split(' ');
                if (parts.length >= 3) {
                    const datePart = parts[0];
                    const timePart = parts[1];
                    const timezonePart = parts[2];

                    // Create ISO format: 2025-06-29T23:30:08.492+12:00
                    const timezone = timezonePart.replace(/(\d{2})(\d{2})/, '$1:$2');
                    dateToFormat = `${datePart}T${timePart}${timezone}`;
                }
            }

            console.log('Original date:', dateValue, 'Formatted for parsing:', dateToFormat);
            const formattedDate = formatDate(dateToFormat);
            console.log('Final formatted date:', formattedDate);
            return formattedDate;

        } catch (error) {
            console.error('Error formatting date:', error, 'Date value:', dateValue);
            return 'Invalid date';
        }
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
                <div className="flex items-center gap-2">
                    <CompactExportButton workOrderId={workOrder.id} />
                    <StatusBadge status={workOrder.status} />
                </div>
            </div>

            {/* Property Info */}
            <div className="space-y-2 mb-3">
                <div>
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
                    {formatWorkOrderDate(workOrder)}
                </div>
                <div className="flex items-center">
                    <span className="mr-2">{workOrder.supplier_name || workOrder.supplierName || 'Williams Property Services Group'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderCard;