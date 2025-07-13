import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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

const WorkOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workOrder, setWorkOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);

    // Add alerts context
    const { refreshAlerts } = useAlerts();
    const { user } = useAuth(); // Get the current user with role
    const isClient = user && user.role === 'client';

    useEffect(() => {
        fetchWorkOrder();
    }, [id]);

    const fetchWorkOrder = async () => {
        try {
            setIsLoading(true);
            const response = await workOrderService.getWorkOrderById(id);
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
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    };

    // Update handlers to refresh alerts after actions
    const handleStatusChange = async (status, notes = '') => {
        try {
            await workOrderService.updateWorkOrderStatus(id, status, notes);
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

            await workOrderService.addNote(id, content);
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
        <button className="p-1 rounded-full hover:bg-vw-green">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
        </button>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-vw-green"></div>
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
                        workOrder && <WorkOrderSummary workOrder={workOrder} />
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

                                {/* For staff/admin users */}
                                {!isClient && (
                                    <button
                                        onClick={() => setShowStatusUpdate(true)}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Update Status</span>
                                    </button>
                                )}

                                {/* For client users - only show cancel button if not already completed/cancelled */}
                                {isClient && workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
                                    <button
                                        onClick={() => setShowStatusUpdate(true)}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span>Request Cancellation</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

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
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default WorkOrderDetailPage;