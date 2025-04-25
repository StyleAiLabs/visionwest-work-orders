import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import StatusBadge from '../components/workOrders/StatusBadge';
import PhotoGallery from '../components/workOrders/PhotoGallery';
import NotesSection from '../components/workOrders/NotesSection';
import DetailItem from '../components/workOrders/DetailItem';
import { workOrderService } from '../services/workOrderService';
import { format } from 'date-fns';

const WorkOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workOrder, setWorkOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWorkOrder();
    }, [id]);

    const fetchWorkOrder = async () => {
        try {
            setIsLoading(true);
            const response = await workOrderService.getWorkOrderById(id);
            console.log('Work Order Details:', response.data); // Debug log
            setWorkOrder(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching work order:', error);
            setError('Failed to load work order details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await workOrderService.updateStatus(id, newStatus);
            await fetchWorkOrder(); // Refresh data after update
        } catch (error) {
            console.error('Error updating status:', error);
            // TODO: Add error toast notification
        }
    };

    const handleSaveNotes = async (content) => {
        try {
            await workOrderService.addNote(id, content);
            await fetchWorkOrder(); // Refresh data to show new note
            return true;
        } catch (error) {
            console.error('Error saving note:', error);
            throw error;
        }
    };

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

            <div className="flex-1 overflow-y-auto">
                {/* Status & Info Box */}
                <div className="bg-white p-4 shadow">
                    <div className="flex justify-between items-center mb-3">
                        <StatusBadge status={workOrder.status} />
                        <span className="text-sm text-gray-500">
                            {format(new Date(workOrder.created_at), 'dd MMM yyyy')}
                        </span>
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">Job #{workOrder.job_no}</h1>
                    <p className="text-sm text-gray-600 mt-1">{workOrder.organization}</p>

                    {/* Status Update Section */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <div className="flex justify-between items-center">
                            <StatusBadge status={workOrder.status} />
                            <button
                                onClick={() => {/* Show status update modal/form */ }}
                                className="text-indigo-600 text-sm font-medium"
                            >
                                Update Status
                            </button>
                        </div>
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
                            <DetailItem label="Property" value={workOrder.property} />
                            <DetailItem label="Created By" value={workOrder.creator?.name} />
                            <DetailItem label="Contact" value={workOrder.contact_number} />
                        </div>
                    </div>

                    {/* Photo Gallery */}
                    <PhotoGallery photos={workOrder.photos} workOrderId={workOrder.id} />

                    {/* Notes Section */}
                    <NotesSection
                        notes={workOrder.notes}
                        onSaveNote={handleSaveNotes}
                        workOrderId={workOrder.id}
                    />
                </div>
            </div>

            <MobileNavigation />
        </div>
    );
};

export default WorkOrderDetailPage;