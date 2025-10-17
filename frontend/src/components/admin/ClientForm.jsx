import React, { useState, useEffect } from 'react';
import { createClient, updateClient } from '../../services/clientService';

/**
 * ClientForm Component
 * Mobile-first full-screen modal for creating/editing clients
 * Includes validation and error handling
 */
const ClientForm = ({ client, onClose, onSuccess }) => {
    const isEditMode = !!client;

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        primary_contact_name: '',
        primary_contact_email: '',
        primary_contact_phone: '',
        status: 'active'
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                code: client.code || '',
                primary_contact_name: client.primary_contact_name || '',
                primary_contact_email: client.primary_contact_email || '',
                primary_contact_phone: client.primary_contact_phone || '',
                status: client.status || 'active'
            });
        }
    }, [client]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Client name is required';
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Client code is required';
        } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
            newErrors.code = 'Code must be uppercase alphanumeric with _ or -';
        }

        if (formData.primary_contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact_email)) {
            newErrors.primary_contact_email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Auto-uppercase code field
        const processedValue = name === 'code' ? value.toUpperCase() : value;

        setFormData({
            ...formData,
            [name]: processedValue
        });

        // Clear error for this field
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);

            if (isEditMode) {
                // Update existing client
                const { code, ...updates } = formData; // Remove code (immutable)
                await updateClient(client.id, updates);
            } else {
                // Create new client
                await createClient(formData);
            }

            onSuccess();
        } catch (error) {
            console.error('Form submission error:', error);

            // Handle validation errors from server
            if (error.response?.data?.errors) {
                const serverErrors = {};
                error.response.data.errors.forEach(err => {
                    serverErrors[err.field] = err.message;
                });
                setErrors(serverErrors);
            } else {
                setServerError(error.response?.data?.message || 'An error occurred');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditMode ? 'Edit Client' : 'Create New Client'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Server Error */}
                    {serverError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {serverError}
                        </div>
                    )}

                    {/* Client Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., ABC Property Management"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Client Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client Code <span className="text-red-500">*</span>
                            {isEditMode && <span className="text-gray-500 ml-2">(Cannot be changed)</span>}
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            disabled={isEditMode}
                            className={`w-full px-4 py-2 border rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                            } ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="e.g., ABC_PROP"
                        />
                        {errors.code && (
                            <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                        )}
                        {!isEditMode && (
                            <p className="mt-1 text-xs text-gray-500">
                                Uppercase letters, numbers, underscores, and hyphens only
                            </p>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    {/* Primary Contact Section */}
                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Contact</h3>

                        {/* Contact Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Name
                            </label>
                            <input
                                type="text"
                                name="primary_contact_name"
                                value={formData.primary_contact_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., John Doe"
                            />
                        </div>

                        {/* Contact Email */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Email
                            </label>
                            <input
                                type="email"
                                name="primary_contact_email"
                                value={formData.primary_contact_email}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.primary_contact_email ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g., john@example.com"
                            />
                            {errors.primary_contact_email && (
                                <p className="mt-1 text-sm text-red-600">{errors.primary_contact_email}</p>
                            )}
                        </div>

                        {/* Contact Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Phone
                            </label>
                            <input
                                type="tel"
                                name="primary_contact_phone"
                                value={formData.primary_contact_phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., +64 21 123 4567"
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Saving...' : isEditMode ? 'Update Client' : 'Create Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientForm;
