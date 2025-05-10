import React from 'react';
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';
import DetailItem from './DetailItem';

const WorkOrderSummary = ({ workOrder }) => {
    if (!workOrder) return null;

    return (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-vw-dark">Summary</h2>
                <StatusBadge status={workOrder.status} />
            </div>

            <div className="text-sm space-y-2">
                <div className="border-b pb-2">
                    <p className="text-gray-600">{workOrder.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                    <DetailItem
                        label="Date"
                        value={workOrder.date || 'N/A'}
                    />
                    <DetailItem
                        label="Property"
                        value={workOrder.property?.name || 'N/A'}
                    />
                    <DetailItem
                        label="Phone"
                        value={workOrder.property?.phone || workOrder.supplier?.phone || 'N/A'}
                    />
                    <DetailItem
                        label="PO Number"
                        value={workOrder.poNumber || 'N/A'}
                    />
                    <DetailItem
                        label="Authorised By"
                        value={workOrder.authorizedBy?.name || 'N/A'}
                    />
                    <DetailItem
                        label="Contact"
                        value={workOrder.authorizedBy?.contact || workOrder.authorizedBy?.email || 'N/A'}
                    />
                </div>
            </div>
        </div>
    );
};

export default WorkOrderSummary;