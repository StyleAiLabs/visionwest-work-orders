import React from 'react';
import { format } from 'date-fns';
import StatusBadge from '../common/StatusBadge';
import DetailItem from './DetailItem';
import { useAuth } from '../../hooks/useAuth';

const WorkOrderSummary = ({ workOrder, onToggleUrgent }) => {
    const { user } = useAuth();

    // Allow all authenticated users to toggle urgent status
    const canToggleUrgent = !!user;

    if (!workOrder) return null;

    // Debug log to see the urgent status
    console.log('WorkOrderSummary - is_urgent:', workOrder.is_urgent, 'Type:', typeof workOrder.is_urgent);

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
                    <div className="flex items-center gap-2">
                        {workOrder.is_urgent && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Urgent
                            </span>
                        )}
                        <StatusBadge status={workOrder.status} />
                    </div>
                </div>

                {/* Urgent Checkbox */}
                {canToggleUrgent && onToggleUrgent && (
                    <div className="mb-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={Boolean(workOrder.is_urgent)}
                                onChange={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    onToggleUrgent(e);
                                }}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
                            />
                            <span className="font-medium select-none">
                                Mark as Urgent
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                            Check to prioritize this work order
                        </p>
                    </div>
                )}

                {/* Cancelled Badge - Show when work order is cancelled */}
                {workOrder.status === 'cancelled' && (
                    <div className="mb-3 pb-3 border-b border-gray-100">
                        <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-md">
                            <span className="text-red-700 font-medium">Cancelled (Permanent)</span>
                            <p className="text-red-600 text-xs mt-1">
                                This work order has been cancelled and cannot be reactivated.
                            </p>
                        </div>
                    </div>
                )}

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