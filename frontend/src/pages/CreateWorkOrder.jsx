import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import WorkOrderForm from '../components/workOrders/WorkOrderForm';
import Toast from '../components/common/Toast';
import { workOrderService } from '../services/workOrderService';
import photoService from '../services/photoService';

const CreateWorkOrder = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if user is not client_admin
    React.useEffect(() => {
        if (user && user.role !== 'client_admin') {
            setToast({
                show: true,
                message: 'You do not have permission to create work orders',
                type: 'error'
            });
            setTimeout(() => navigate('/work-orders'), 2000);
        }
    }, [user, navigate]);

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    };

    const handleSubmit = async (formData) => {
        try {
            setIsSubmitting(true);
            console.log('Submitting work order:', formData);

            // Extract photos from form data
            const { photos, ...workOrderData } = formData;

            // Create the work order first
            const response = await workOrderService.createWorkOrder(workOrderData);

            if (response.success) {
                const workOrderId = response.data.id;

                // Upload photos if any were selected
                if (photos && photos.length > 0) {
                    try {
                        console.log(`Uploading ${photos.length} photos for work order ${workOrderId}`);
                        await photoService.uploadPhotos(workOrderId, photos, 'Before photos');
                        showToast('Work order and photos uploaded successfully', 'success');
                    } catch (photoError) {
                        console.error('Error uploading photos:', photoError);
                        // Work order was created successfully, but photos failed
                        showToast('Work order created, but some photos failed to upload', 'warning');
                    }
                } else {
                    showToast('Work order created successfully', 'success');
                }

                // Navigate to work orders list after a brief delay to show success message
                setTimeout(() => {
                    navigate('/work-orders');
                }, 1500);
            } else {
                showToast(response.message || 'Failed to create work order', 'error');
            }
        } catch (error) {
            console.error('Error creating work order:', error);

            // Extract error message from response
            const errorMessage = error.response?.data?.message ||
                                error.message ||
                                'Failed to create work order. Please try again.';

            showToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/work-orders');
    };

    // Don't render form if user is not authorized
    if (user && user.role !== 'client_admin') {
        return (
            <div className="min-h-screen bg-gray-50">
                <AppHeader
                    title="Create Work Order"
                    showBackButton={true}
                    onBackClick={() => navigate('/work-orders')}
                />
                <div className="pt-20 p-4">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <p className="text-red-700">You do not have permission to create work orders.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <AppHeader
                title="Create Work Order"
                showBackButton={true}
                onBackClick={handleCancel}
            />

            <div className="pt-16 p-4">
                <div className="max-w-4xl mx-auto">
                    {/* Page Description */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
                        <h2 className="text-sm font-medium text-blue-800 mb-1">Manual Work Order Entry</h2>
                        <p className="text-sm text-blue-700">
                            Fill in the form below to create a new work order. Fields marked with * are required.
                        </p>
                    </div>

                    {/* Work Order Form */}
                    <WorkOrderForm
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        submitLabel="Create Work Order"
                    />
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

export default CreateWorkOrder;
