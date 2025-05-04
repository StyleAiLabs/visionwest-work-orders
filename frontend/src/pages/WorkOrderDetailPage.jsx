import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { workOrderService } from '../services/workOrderService';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import StatusBadge from '../components/workOrders/StatusBadge';
import PhotoGallery from '../components/workOrders/PhotoGallery';
import NotesSection from '../components/workOrders/NotesSection';
import DetailItem from '../components/workOrders/DetailItem';
import StatusUpdateForm from '../components/workOrders/StatusUpdateForm';
import Toast from '../components/common/Toast';
import NotesHistory from '../components/workOrders/NotesHistory';
import { useAlerts } from '../context/AlertContext';
import { useAuth } from '../hooks/useAuth'; // Correct import path

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

    // Header options menu
    const headerRightContent = (
        <button className="p-1 rounded-full hover:bg-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
        </button>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
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
        <div className="min-h-screen flex flex-col bg-gray-50 pb-20">
            <AppHeader
                title={`Job #${workOrder?.jobNo || 'Unknown'}`}
                showBackButton={true}
                onBackClick={() => navigate('/work-orders')}
            />

            {/* Work Order Details */}
            <div className="flex-1 p-4">
                {safeRender(() => (
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                        {/* Order details content... */}

                        {/* Only show status update button for non-client users */}
                        {!isClient && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setShowStatusUpdate(true)}
                                    className="w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                                >
                                    Update Status
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {/* Status Update Form - Only shown when showStatusUpdate is true and user is not client */}
                {safeRender(() => (
                    showStatusUpdate && !isClient && (
                        <StatusUpdateForm
                            initialStatus={workOrder.status}
                            onSubmit={handleStatusChange} // Fixed: Use the correct function name
                            onCancel={() => setShowStatusUpdate(false)}
                        />
                    )
                ))}

                {/* Photo Gallery - Only allow uploads for non-client users */}
                {safeRender(() => (
                    <PhotoGallery
                        photos={workOrder.photos || []}
                        workOrderId={id}
                        onPhotoDeleted={handlePhotoDeleted}
                        canUpload={!isClient} // Pass this prop to control upload button visibility
                    />
                ))}

                {/* Notes Section - Available to all users including clients */}
                <NotesSection
                    workOrderId={id}
                    onSaveNotes={handleSaveNotes} // Change to match the expected prop name
                />

                {/* Notes/Status History */}
                <NotesHistory
                    notes={workOrder.notes}
                    statusUpdates={workOrder.statusUpdates}
                />
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