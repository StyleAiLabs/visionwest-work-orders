import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import StatusRadioGroup from '../components/workOrders/StatusRadioGroup';
import ClientStatusUpdateForm from '../components/workOrders/ClientStatusUpdateForm'; // Import client form
import Button from '../components/common/Button';
import { workOrderService } from '../services/workOrderService'; // Import actual service
import { useAuth } from '../hooks/useAuth';
import { useAlerts } from '../context/AlertContext'; // Import alerts context

const StatusUpdatePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { refreshAlerts } = useAlerts(); // Add this to refresh alerts after status change
    const isClient = user && user.role === 'client';

    const [workOrder, setWorkOrder] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // Redirect non-staff away from this page, but allow clients if they're cancelling
    useEffect(() => {
        if (isClient) {
            // We'll handle client cancellation in a special way
            // by rendering a different form instead of redirecting them away
            setSelectedStatus('cancelled');
        }
    }, [user, id, navigate, isClient]);

    // Fetch work order details
    useEffect(() => {
        const fetchWorkOrder = async () => {
            try {
                setIsLoading(true);
                // Use the actual service instead of mock data
                const response = await workOrderService.getWorkOrderById(id);
                setWorkOrder(response.data);
                setSelectedStatus(isClient ? 'cancelled' : response.data.status);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching work order:', error);
                setError('Failed to load work order details');
                setIsLoading(false);
            }
        };

        fetchWorkOrder();
    }, [id, isClient]);

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
    };

    const handleSubmit = async () => {
        if (!isClient && selectedStatus === workOrder.status && !notes) {
            // No changes were made by staff
            navigate(`/work-orders/${id}`);
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Use the actual service to update status
            await workOrderService.updateWorkOrderStatus(id, selectedStatus, notes);

            // Refresh alerts to show new notifications
            await refreshAlerts();

            // Navigate back to work order detail page after successful update
            navigate(`/work-orders/${id}`);
        } catch (error) {
            console.error('Error updating status:', error);
            setError(error.response?.data?.message || 'Failed to update status');
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/work-orders/${id}`);
    };

    // Update the loading spinner
    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-vw-green"></div>
            </div>
        );
    }

    // Update the status color functions
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-amber-600';
            case 'in-progress': return 'text-vw-green';
            case 'completed': return 'text-green-600';
            case 'cancelled': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'in-progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            default: return 'Unknown';
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 pt-16">
            <AppHeader
                title={isClient ? "Request Cancellation" : "Update Status"}
                showBackButton={true}
                onBackClick={() => navigate(`/work-orders/${id}`)}
            />

            {/* Status Update Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                {error && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 text-sm">
                        {error}
                    </div>
                )}

                {workOrder && (
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Job #{workOrder.jobNo}</h3>
                        <p className="text-xs text-gray-500">{workOrder.property?.name || workOrder.property}</p>
                        <div className="mt-3 text-xs text-gray-500">
                            <p>{workOrder.description}</p>
                        </div>
                    </div>
                )}

                {/* Different forms for client vs staff */}
                {isClient ? (
                    // Special client cancellation form
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                        <h2 className="text-md font-semibold mb-4">
                            Request Work Order Cancellation
                        </h2>

                        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-gray-700 mb-2">
                                Are you sure you want to request cancellation of this work order?
                            </p>
                            <p className="text-xs text-gray-500">
                                Please provide a reason for the cancellation request. The maintenance team will be notified.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="status-notes" className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Cancellation <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="status-notes"
                                rows="3"
                                className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                                placeholder="Please explain why you'd like to cancel this work order"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                required
                            ></textarea>
                        </div>
                    </div>
                ) : (
                    // Regular staff status update form
                    <>
                        <div className="bg-white rounded-lg shadow p-4 mb-4">
                            <h2 className="text-md font-semibold mb-4">
                                Current Status: <span className={getStatusColor(workOrder.status)}>
                                    {getStatusDisplay(workOrder.status)}
                                </span>
                            </h2>

                            <StatusRadioGroup
                                status={selectedStatus}
                                onStatusChange={handleStatusChange}
                            />
                        </div>

                        <div className="bg-white rounded-lg shadow p-4 mb-4">
                            <label htmlFor="status-notes" className="block text-sm font-medium text-gray-700 mb-2">Status Notes</label>
                            <textarea
                                id="status-notes"
                                rows="3"
                                className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                                placeholder="Add notes about the status change..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            ></textarea>
                        </div>
                    </>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={isClient ? "danger" : "primary"}
                        onClick={handleSubmit}
                        disabled={isSaving || (isClient && !notes.trim())}
                    >
                        {isSaving ? 'Processing...' : isClient ? 'Request Cancellation' : 'Update Status'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StatusUpdatePage;