import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { workOrderService } from '../services/workOrderService';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import StatusBadge from '../components/common/StatusBadge';
import PhotoGallery from '../components/workOrders/PhotoGallery';
import NotesSection from '../components/workOrders/NotesSection';
import DetailItem from '../components/workOrders/DetailItem';
import StatusUpdateForm from '../components/workOrders/StatusUpdateForm';
import Toast from '../components/common/Toast';
import NotesHistory from '../components/workOrders/NotesHistory';
import { useAlerts } from '../context/AlertContext';
import { useAuth } from '../hooks/useAuth'; // Correct import path
import ClientStatusUpdateForm from '../components/workOrders/ClientStatusUpdateForm';
import WorkOrderSummary from '../components/workOrders/WorkOrderSummary';
import ExportButton from '../components/common/ExportButton';
import ConfirmCancelDialog from '../components/workOrders/ConfirmCancelDialog';

const WorkOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshAlerts } = useAlerts();
    const { user } = useAuth(); // Get the current user with role

    // Get clientId from navigation state (passed from WorkOrdersPage when admin filters by client)
    // Only use clientId for staff/admin roles (context switching feature)
    const clientId = (user?.role === 'staff' || user?.role === 'admin') ? location.state?.clientId : null;

    const [workOrder, setWorkOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toastState, setToastState] = useState({ show: false, message: '', type: 'error' });
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const isClient = user && user.role === 'client';
    // Allow all authenticated users to toggle urgent status
    const canToggleUrgent = !!user;
    // Determine if user can cancel (client, client_admin, admin only - NOT staff)
    const canCancel = user && ['client', 'client_admin', 'admin'].includes(user.role);

    useEffect(() => {
        fetchWorkOrder();
    }, [id]);

    const fetchWorkOrder = async () => {
        try {
            setIsLoading(true);
            const response = await workOrderService.getWorkOrderById(id, clientId);
            setWorkOrder(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching work order details:', error);
            setError('Failed to load work order details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const showToast = (message, type = 'error') => {
        setToastState({ show: true, message, type });
        setTimeout(() => setToastState({ show: false, message: '', type: 'error' }), 3000);
    };

    // Handle work order cancellation
    const handleCancelClick = () => {
        setShowCancelDialog(true);
    };

    const handleConfirmCancel = async (notes) => {
        setIsCancelling(true);
        try {
            // Pass notes from dialog (required for clients, optional for others)
            const response = await workOrderService.updateWorkOrderStatus(workOrder.id, 'cancelled', notes);

            if (response.success) {
                setShowCancelDialog(false);
                toast.success('Work order cancelled successfully');

                // Refresh work order data from server to ensure UI is in sync
                await fetchWorkOrder();

                // Refresh alerts
                await refreshAlerts();
            } else {
                toast.error(response.message || 'Failed to cancel work order');
            }
        } catch (error) {
            console.error('Error cancelling work order:', error);

            // Handle specific error cases
            if (error.response?.status === 400) {
                // Close dialog and update state if already cancelled
                setShowCancelDialog(false);
                toast.error(error.response.data?.message || 'This work order is already cancelled');

                // Update local state to reflect cancelled status
                setWorkOrder({ ...workOrder, status: 'cancelled' });
            } else if (error.response?.status === 403) {
                setShowCancelDialog(false);
                toast.error(error.response.data?.message || 'You do not have permission to cancel this work order');
            } else {
                toast.error('Failed to cancel work order. Please try again.');
            }
        } finally {
            setIsCancelling(false);
        }
    };

    // Update handlers to refresh alerts after actions
    const handleStatusChange = async (status, notes = '') => {
        try {
            await workOrderService.updateWorkOrderStatus(id, status, notes, clientId);
            await fetchWorkOrder();
            await refreshAlerts(); // Refresh alerts after status change
            showToast('Status updated successfully', 'success');
            setShowStatusUpdate(false); // Hide the status form
        } catch (error) {
            console.error('Error updating status:', error);
            showToast('Failed to update status');
        }
    };

    const handleSaveNotes = async (content) => {
        try {
            if (!content || content.trim() === '') {
                showToast('Note content cannot be empty', 'error');
                return false;
            }

            await workOrderService.addNote(id, content, clientId);
            await fetchWorkOrder();
            await refreshAlerts(); // Refresh alerts after adding note
            showToast('Note added successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error saving note:', error);
            showToast('Failed to add note', 'error');
            return false;
        }
    };

    const handleToggleUrgent = async () => {
        if (!canToggleUrgent) return;

        try {
            const newUrgentStatus = !workOrder.is_urgent;

            // Optimistically update the UI immediately
            setWorkOrder(prev => ({
                ...prev,
                is_urgent: newUrgentStatus
            }));

            // Then update the backend
            await workOrderService.updateWorkOrder(id, { is_urgent: newUrgentStatus }, clientId);

            showToast(
                newUrgentStatus ? 'Marked as urgent' : 'Removed urgent flag',
                'success'
            );
        } catch (error) {
            console.error('Error toggling urgent status:', error);
            // Revert the optimistic update on error
            setWorkOrder(prev => ({
                ...prev,
                is_urgent: !newUrgentStatus
            }));
            showToast(error.response?.data?.message || 'Failed to update urgent status', 'error');
        }
    };

    // Update the handlePhotoDeleted function:
    const handlePhotoDeleted = async () => {
        try {
            // First fetch the updated work order data to refresh photos
            await fetchWorkOrder();
            // Then show success toast after data is refreshed
            showToast('Photo deleted successfully', 'success');
        } catch (error) {
            console.error('Error refreshing after photo deletion:', error);
            showToast('Photo was deleted but refresh failed', 'error');
        }
    };

    // Add this helper function
    const safeRender = (component, fallback = null) => {
        try {
            return component();
        } catch (error) {
            console.error('Error rendering component:', error);
            return fallback;
        }
    };

    // Update the header right content button styles

    const headerRightContent = (
        <button className="p-1 rounded-full hover:bg-nextgen-green">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
        </button>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nextgen-green"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <AppHeader
                    title="Error"
                    showBackButton={true}
                    onBackClick={() => navigate('/work-orders')}
                />
                <div className="flex-1 p-4">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <p className="text-red-700">{error}</p>
                        <button
                            className="mt-2 text-red-700 underline"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AppHeader
                title={`Job #${workOrder?.jobNo || 'Unknown'}`}
                showBackButton={true}
                onBackClick={() => navigate('/work-orders')}
                rightContent={headerRightContent}
            />

            {/* Main Content Container with top padding for fixed header */}
            <div className="pb-20 min-h-screen overflow-y-auto" style={{ paddingTop: '64px' }}>
                <div className="max-w-4xl mx-auto p-4 space-y-4">

                    {/* Work Order Summary */}
                    {safeRender(() => (
                        workOrder && <WorkOrderSummary
                            workOrder={workOrder}
                            onToggleUrgent={canToggleUrgent ? handleToggleUrgent : null}
                        />
                    ))}

                    {/* Action Buttons Section */}
                    {!isLoading && workOrder && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Actions</h3>
                            <div className="space-y-3">
                                {/* Export PDF Button - Available to all users */}
                                <ExportButton
                                    workOrderId={workOrder.id}
                                    size="default"
                                    variant="outline"
                                    className="w-full"
                                />

                                {/* Cancel Work Order Button - For client, client_admin, admin (NOT staff) */}
                                {canCancel && workOrder.status !== 'cancelled' && workOrder.status !== 'completed' && (
                                    <button
                                        onClick={handleCancelClick}
                                        disabled={isCancelling}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-pure-white rounded-lg text-sm font-medium transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Cancel work order"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span>{isCancelling ? 'Cancelling...' : 'Cancel Work Order'}</span>
                                    </button>
                                )}

                                {/* Update Status Button - For staff and admin users */}
                                {(user?.role === 'staff' || user?.role === 'admin') && (
                                    <button
                                        onClick={() => setShowStatusUpdate(true)}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-deep-navy hover:bg-deep-navy-dark text-pure-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Update Status</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Confirmation Dialog */}
                    <ConfirmCancelDialog
                        isOpen={showCancelDialog}
                        onConfirm={handleConfirmCancel}
                        onCancel={() => setShowCancelDialog(false)}
                        workOrderId={workOrder?.id}
                        userRole={user?.role}
                    />

                    {/* Status Update Form */}
                    {safeRender(() => (
                        showStatusUpdate && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {isClient ? 'Request Cancellation' : 'Update Status'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {isClient ? 'Provide a reason for cancellation request' : 'Change the work order status and add notes'}
                                    </p>
                                </div>
                                <div className="p-4">
                                    {isClient ?
                                        <ClientStatusUpdateForm
                                            onSubmit={handleStatusChange}
                                            onCancel={() => setShowStatusUpdate(false)}
                                        /> :
                                        <StatusUpdateForm
                                            initialStatus={workOrder.status}
                                            onSubmit={handleStatusChange}
                                            onCancel={() => setShowStatusUpdate(false)}
                                        />
                                    }
                                </div>
                            </div>
                        )
                    ))}

                    {/* Photo Gallery */}
                    {safeRender(() => (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
                                <p className="text-sm text-gray-600">Work order documentation and progress photos</p>
                            </div>
                            <div className="p-4">
                                <PhotoGallery
                                    photos={workOrder.photos || []}
                                    workOrderId={id}
                                    onPhotoDeleted={handlePhotoDeleted}
                                    canUpload={!isClient}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Notes & Communication */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Notes & Communication</h3>
                            <p className="text-sm text-gray-600">Track progress, updates, and communication history</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {/* Add Notes Section */}
                            <div className="p-4">
                                <NotesSection
                                    workOrderId={id}
                                    onSaveNotes={handleSaveNotes}
                                />
                            </div>
                            {/* Notes History */}
                            <div className="p-4">
                                <NotesHistory
                                    notes={workOrder.notes}
                                    statusUpdates={workOrder.statusUpdates}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <MobileNavigation />

            {/* Toast notification */}
            {toastState.show && (
                <Toast
                    message={toastState.message}
                    type={toastState.type}
                    onClose={() => setToastState({ ...toastState, show: false })}
                />
            )}
        </div>
    );
};

export default WorkOrderDetailPage;