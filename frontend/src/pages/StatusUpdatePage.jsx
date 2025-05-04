import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import StatusRadioGroup from '../components/workOrders/StatusRadioGroup';
import Button from '../components/common/Button';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth'; // Import useAuth

const StatusUpdatePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Get user info
    const [workOrder, setWorkOrder] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Redirect clients away from this page
    useEffect(() => {
        if (user && user.role === 'client') {
            navigate(`/work-orders/${id}`);
        }
    }, [user, id, navigate]);

    // Fetch work order details
    useEffect(() => {
        const fetchWorkOrder = async () => {
            try {
                setIsLoading(true);
                // In a real implementation, this would be an actual API call
                // const response = await api.get(`/work-orders/${id}`);
                // setWorkOrder(response.data);
                // setSelectedStatus(response.data.status);

                // Mock data for development
                setTimeout(() => {
                    const mockWorkOrder = {
                        id: id,
                        jobNo: 'RBWO010965',
                        status: 'pending',
                        property: 'VisionWest Community Trust',
                        description: 'Cleaning rubbish/debris off the roof to determine cause of leak.'
                    };

                    setWorkOrder(mockWorkOrder);
                    setSelectedStatus(mockWorkOrder.status);
                    setIsLoading(false);
                }, 800);
            } catch (error) {
                console.error('Error fetching work order:', error);
                setIsLoading(false);
            }
        };

        fetchWorkOrder();
    }, [id]);

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
    };

    const handleSubmit = async () => {
        if (selectedStatus === workOrder.status && !notes) {
            // No changes were made
            navigate(`/work-orders/${id}`);
            return;
        }

        setIsSaving(true);

        try {
            // In a real implementation, this would update the status via API
            // await api.patch(`/work-orders/${id}/status`, { 
            //   status: selectedStatus,
            //   notes: notes 
            // });

            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Navigate back to work order detail page after successful update
            navigate(`/work-orders/${id}`);
        } catch (error) {
            console.error('Error updating status:', error);
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
            default: return 'text-gray-600';
        }
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'in-progress': return 'In Progress';
            case 'completed': return 'Completed';
            default: return 'Unknown';
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <AppHeader
                title="Update Status"
                showBackButton={true}
                onBackClick={() => navigate(`/work-orders/${id}`)}
            />

            {/* Status Update Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Job #{workOrder.jobNo}</h3>
                    <p className="text-xs text-gray-500">{workOrder.property}</p>
                    <div className="mt-3 text-xs text-gray-500">
                        <p>{workOrder.description}</p>
                    </div>
                </div>

                {/* Status Selection */}
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

                {/* Status Notes */}
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
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Updating...' : 'Update Status'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StatusUpdatePage;