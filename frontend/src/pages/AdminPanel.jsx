import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientList from '../components/admin/ClientList';
import ClientForm from '../components/admin/ClientForm';
import { deleteClient } from '../services/clientService';

/**
 * AdminPanel Page
 * Main admin interface for managing clients
 * Admin only - requires admin role
 */
const AdminPanel = () => {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

    const handleCreateNew = () => {
        setSelectedClient(null);
        setShowForm(true);
    };

    const handleClientSelect = (client) => {
        setSelectedClient(client);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setSelectedClient(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedClient(null);
        // Trigger refresh of client list
        setRefreshKey(prev => prev + 1);
    };

    const handleDeleteClick = (client, e) => {
        e.stopPropagation(); // Prevent triggering edit
        setConfirmDelete(client);
        setDeleteError(null);
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;

        try {
            await deleteClient(confirmDelete.id);
            setConfirmDelete(null);
            setDeleteError(null);
            // Trigger refresh of client list
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Delete error:', error);
            setDeleteError(error.response?.data?.message || 'Failed to delete client');

            // If client has users/work orders, show details
            if (error.response?.data?.details) {
                setDeleteError(
                    `Cannot delete client with ${error.response.data.details.user_count} users and ${error.response.data.details.work_order_count} work orders`
                );
            }
        }
    };

    const handleDeleteCancel = () => {
        setConfirmDelete(null);
        setDeleteError(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Back to Dashboard button */}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Back to Dashboard"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                                <p className="text-sm text-gray-600 mt-1">Manage client organizations</p>
                            </div>
                        </div>

                        {/* Admin Badge and Settings */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Settings"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Admin
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <ClientList
                    key={refreshKey}
                    onClientSelect={handleClientSelect}
                    onCreateNew={handleCreateNew}
                />
            </div>

            {/* Client Form Modal */}
            {showForm && (
                <ClientForm
                    client={selectedClient}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-start mb-4">
                            <div className="flex-shrink-0">
                                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Delete Client
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Are you sure you want to archive <strong>{confirmDelete.name}</strong>?
                                    {confirmDelete.code === 'VISIONWEST' && (
                                        <span className="block mt-2 text-red-600 font-medium">
                                            Warning: This is the Visionwest client and cannot be deleted.
                                        </span>
                                    )}
                                </p>

                                {deleteError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {deleteError}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
