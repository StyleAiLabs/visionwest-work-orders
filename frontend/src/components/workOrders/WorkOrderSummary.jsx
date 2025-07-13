import React from 'react';
import { format } from 'date-fns';
import StatusBadge from '../common/StatusBadge';
import DetailItem from './DetailItem';

const WorkOrderSummary = ({ workOrder }) => {
    if (!workOrder) return null;

    const formatAddress = (workOrder) => {
        const address = workOrder.property_address ||
            workOrder.property?.address ||
            workOrder.propertyAddress ||
            workOrder.property?.name ||
            workOrder.property_name ||
            workOrder.propertyName;
        return address || 'Address not available';
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header Section */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
                    <StatusBadge status={workOrder.status} />
                </div>
                <div className="pr-0">
                    <p className="text-sm text-gray-600 leading-relaxed">{workOrder.description}</p>
                </div>
            </div>

            {/* Property Information */}
            <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Property Details</h3>
                <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-gray-900 font-medium">{formatAddress(workOrder)}</span>
                    </div>
                    {(workOrder.property?.phone || workOrder.property_phone || workOrder.propertyPhone) && (
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-sm text-gray-600">{workOrder.property?.phone || workOrder.property_phone || workOrder.propertyPhone}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Work Order Information */}
            <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Work Order Information</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <DetailItem
                        label="Date"
                        value={workOrder.date || workOrder.createdAt ? format(new Date(workOrder.date || workOrder.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    />
                    <DetailItem
                        label="PO Number"
                        value={workOrder.poNumber || workOrder.po_number || 'N/A'}
                    />
                    <DetailItem
                        label="Authorised By"
                        value={workOrder.authorizedBy?.name || workOrder.authorized_by || workOrder.authorisedBy || 'N/A'}
                    />
                    <DetailItem
                        label="Contact"
                        value={workOrder.authorizedBy?.contact || workOrder.authorized_contact || workOrder.authorizedBy?.email || workOrder.authorized_email || workOrder.authorisedContact || 'N/A'}
                    />
                </div>
            </div>
        </div>
    );
};

export default WorkOrderSummary;