import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';

const WorkOrderForm = ({ initialData = {}, onSubmit, onCancel, submitLabel = "Create Work Order" }) => {
    const { user } = useAuth();
    const [selectedPhotos, setSelectedPhotos] = useState([]);

    // Auto-populate authorized by fields from logged-in user
    const defaultValues = {
        ...initialData,
        authorized_by: initialData.authorized_by || user?.full_name || '',
        authorized_contact: initialData.authorized_contact || user?.phone || '',
        authorized_email: initialData.authorized_email || user?.email || ''
    };

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues
    });

    const inputClasses = "w-full h-11 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-vw-green focus:border-vw-green transition-colors";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
    const errorClasses = "text-red-600 text-sm mt-1";

    // Handle photo selection
    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max

            if (!isValidType) {
                alert('Only image files are allowed');
            }
            if (!isValidSize) {
                alert('Image file size must be less than 5MB');
            }

            return isValidType && isValidSize;
        });

        // Create preview URLs for the selected files
        const newPhotos = validFiles.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));

        setSelectedPhotos(prev => [...prev, ...newPhotos]);
    };

    // Remove a photo from the selection
    const handleRemovePhoto = (index) => {
        setSelectedPhotos(prev => {
            const newPhotos = [...prev];
            // Revoke the object URL to avoid memory leaks
            URL.revokeObjectURL(newPhotos[index].previewUrl);
            newPhotos.splice(index, 1);
            return newPhotos;
        });
    };

    // Wrap the original onSubmit to include photos
    const handleFormSubmit = (data) => {
        // Include selected photos in the form data
        const formDataWithPhotos = {
            ...data,
            photos: selectedPhotos.map(photo => photo.file)
        };
        onSubmit(formDataWithPhotos);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Required Fields Section */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-2">Required Information</h3>

                {/* Job Number */}
                <div>
                    <label htmlFor="job_no" className={labelClasses}>
                        Job Number <span className="text-red-600">*</span>
                    </label>
                    <input
                        id="job_no"
                        type="text"
                        className={inputClasses}
                        placeholder="e.g., WO-2025-001"
                        {...register('job_no', {
                            required: 'Job number is required',
                            pattern: {
                                value: /^[A-Za-z0-9-]+$/,
                                message: 'Job number can only contain letters, numbers, and hyphens'
                            }
                        })}
                    />
                    {errors.job_no && <p className={errorClasses}>{errors.job_no.message}</p>}
                </div>

                {/* Property Name */}
                <div>
                    <label htmlFor="property_name" className={labelClasses}>
                        Property Name <span className="text-red-600">*</span>
                    </label>
                    <input
                        id="property_name"
                        type="text"
                        className={inputClasses}
                        placeholder="e.g., Sunset Apartments - Unit 4B"
                        {...register('property_name', { required: 'Property name is required' })}
                    />
                    {errors.property_name && <p className={errorClasses}>{errors.property_name.message}</p>}
                </div>

                {/* Property Address */}
                <div>
                    <label htmlFor="property_address" className={labelClasses}>
                        Property Address <span className="text-red-600">*</span>
                    </label>
                    <textarea
                        id="property_address"
                        rows="2"
                        className={`${inputClasses} h-auto`}
                        placeholder="e.g., 123 Main Street, Auckland 1010"
                        {...register('property_address', { required: 'Property address is required' })}
                    />
                    {errors.property_address && <p className={errorClasses}>{errors.property_address.message}</p>}
                </div>

                {/* Property Phone */}
                <div>
                    <label htmlFor="property_phone" className={labelClasses}>
                        Property Phone <span className="text-red-600">*</span>
                    </label>
                    <input
                        id="property_phone"
                        type="tel"
                        className={inputClasses}
                        placeholder="e.g., 09 987 6543"
                        {...register('property_phone', { required: 'Property phone is required' })}
                    />
                    {errors.property_phone && <p className={errorClasses}>{errors.property_phone.message}</p>}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className={labelClasses}>
                        Description <span className="text-red-600">*</span>
                    </label>
                    <textarea
                        id="description"
                        rows="4"
                        className={`${inputClasses} h-auto`}
                        placeholder="Describe the work to be done..."
                        {...register('description', { required: 'Description is required' })}
                    />
                    {errors.description && <p className={errorClasses}>{errors.description.message}</p>}
                </div>
            </div>

            {/* Before Photos Section */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-2">Before Photos (Optional)</h3>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                    <p className="text-xs text-blue-700">
                        <strong>Tip:</strong> Upload photos documenting the initial state of the maintenance issue. This helps maintenance staff understand the problem better.
                    </p>
                </div>

                {/* Photo Upload Interface */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Add photos from camera or gallery</p>
                    <div className="mt-3 flex space-x-3">
                        <label className="bg-vw-green hover:bg-vw-green-dark text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
                            Camera
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoSelect}
                                className="hidden"
                                disabled={isSubmitting}
                            />
                        </label>
                        <label className="bg-vw-green hover:bg-vw-green-dark text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
                            Gallery
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoSelect}
                                className="hidden"
                                disabled={isSubmitting}
                            />
                        </label>
                    </div>
                </div>

                {/* Preview Selected Photos */}
                {selectedPhotos.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Selected Photos ({selectedPhotos.length})
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                            {selectedPhotos.map((photo, index) => (
                                <div key={index} className="relative">
                                    <div className="aspect-square bg-gray-200 rounded-md overflow-hidden">
                                        <img
                                            src={photo.previewUrl}
                                            alt={`Selected photo ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        onClick={() => handleRemovePhoto(index)}
                                        disabled={isSubmitting}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Authorization Details Section */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-2">Authorization Details (Optional)</h3>

                {/* Informational note about auto-populated fields */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                    <p className="text-xs text-blue-700">
                        <strong>Note:</strong> Authorization details are automatically filled with your profile information. You can modify them if needed.
                    </p>
                </div>

                <div>
                    <label htmlFor="po_number" className={labelClasses}>
                        PO Number
                    </label>
                    <input
                        id="po_number"
                        type="text"
                        className={inputClasses}
                        placeholder="e.g., PO-2025-789"
                        {...register('po_number')}
                    />
                </div>

                <div>
                    <label htmlFor="authorized_by" className={labelClasses}>
                        Authorized By (Auto-filled)
                    </label>
                    <input
                        id="authorized_by"
                        type="text"
                        className={inputClasses}
                        placeholder="Your name"
                        {...register('authorized_by')}
                    />
                </div>

                <div>
                    <label htmlFor="authorized_contact" className={labelClasses}>
                        Authorized Contact (Auto-filled)
                    </label>
                    <input
                        id="authorized_contact"
                        type="tel"
                        className={inputClasses}
                        placeholder="Your phone number"
                        {...register('authorized_contact')}
                    />
                </div>

                <div>
                    <label htmlFor="authorized_email" className={labelClasses}>
                        Authorized Email (Auto-filled)
                    </label>
                    <input
                        id="authorized_email"
                        type="email"
                        className={inputClasses}
                        placeholder="Your email address"
                        {...register('authorized_email', {
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Please enter a valid email address'
                            }
                        })}
                    />
                    {errors.authorized_email && <p className={errorClasses}>{errors.authorized_email.message}</p>}
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full sm:w-auto px-6 h-11 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vw-green transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto sm:flex-1 px-6 h-11 bg-vw-green hover:bg-vw-green-dark text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vw-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? 'Saving...' : submitLabel}
                </button>
            </div>
        </form>
    );
};

export default WorkOrderForm;
