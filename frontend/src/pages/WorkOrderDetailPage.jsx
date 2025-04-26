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

const WorkOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workOrder, setWorkOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);

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

    const handleStatusChange = async (status, notes = '') => {
        try {
            await workOrderService.updateWorkOrderStatus(id, status, notes);
            await fetchWorkOrder(); // Refresh data after status update
            showToast('Status updated successfully', 'success');
            setShowStatusUpdate(false); // Hide the status form
        } catch (error) {
            console.error('Error updating status:', error);
            showToast('Failed to update status');
        }
    };

    const handleSaveNotes = async (content) => {
        try {
            await workOrderService.addNote(id, content);
            await fetchWorkOrder(); // Refresh data to show new note
            return true;
        } catch (error) {
            console.error('Error saving notes:', error);
            throw error;
        }
    };

    // Header options menu
    const headerRightContent = (
        <button className="p-1 rounded-full hover:bg-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
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
        <div className="min-h-screen flex flex-col bg-gray-50 pb-16">
            <AppHeader
                title="Work Order Details"
                showBackButton={true}
                onBackClick={() => navigate('/work-orders')}
                rightContent={headerRightContent}
            />

            {/* Work Order Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Status & Info Box */}
                <div className="bg-white p-4 shadow">
                    <div className="flex justify-between items-center mb-3">
                        <StatusBadge status={workOrder.status} />
                        <span className="text-sm text-gray-500">{workOrder.date}</span>
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">Job #{workOrder.jobNo}</h1>
                    <p className="text-sm text-gray-600 mt-1">{workOrder.property.name}</p>

                    {/* Update Status */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <div className="flex justify-between items-center">
                            <StatusBadge status={workOrder.status} />
                            <button
                                onClick={() => setShowStatusUpdate(true)}
                                className="text-indigo-600 text-sm font-medium flex items-center"
                            >
                                <span>Update Status</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {showStatusUpdate && (
                            <div className="mt-3">
                                <StatusUpdateForm
                                    currentStatus={workOrder.status}
                                    onStatusChange={handleStatusChange}
                                    onCancel={() => setShowStatusUpdate(false)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Work Order Details */}
                <div className="p-4">
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                        <h2 className="text-md font-semibold mb-3">Work Description</h2>
                        <p className="text-sm text-gray-600">{workOrder.description}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                        <h2 className="text-md font-semibold mb-3">Details</h2>
                        <div className="space-y-2 text-sm">
                            <DetailItem label="PO Number" value={workOrder.poNumber} />
                            <DetailItem label="Supplier" value={workOrder.supplier.name} />
                            <DetailItem label="Authorized By" value={workOrder.authorizedBy.name} />
                            <DetailItem label="Contact" value={workOrder.authorizedBy.contact} />
                        </div>
                    </div>

                    {/* Photo Gallery */}
                    <PhotoGallery photos={workOrder.photos} workOrderId={workOrder.id} />

                    {/* Notes Section */}
                    <NotesSection
                        initialNotes={workOrder.notes}
                        onSaveNotes={handleSaveNotes}
                    />
                </div>
            </div>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: '', type: 'error' })}
                />
            )}

            {/* Bottom Navigation */}
            <MobileNavigation />
        </div>
    );
};

export default WorkOrderDetailPage;