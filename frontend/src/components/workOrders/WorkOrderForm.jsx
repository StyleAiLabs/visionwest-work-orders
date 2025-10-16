import React from 'react';
import { useForm } from 'react-hook-form';

const WorkOrderForm = ({ initialData = {}, onSubmit, onCancel, submitLabel = "Create Work Order" }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: initialData
    });

    const inputClasses = "w-full h-11 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-vw-green focus:border-vw-green transition-colors";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
    const errorClasses = "text-red-600 text-sm mt-1";

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                {/* Supplier Name */}
                <div>
                    <label htmlFor="supplier_name" className={labelClasses}>
                        Supplier Name <span className="text-red-600">*</span>
                    </label>
                    <input
                        id="supplier_name"
                        type="text"
                        className={inputClasses}
                        placeholder="e.g., ABC Plumbing Services"
                        {...register('supplier_name', { required: 'Supplier name is required' })}
                    />
                    {errors.supplier_name && <p className={errorClasses}>{errors.supplier_name.message}</p>}
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

            {/* Supplier Details Section */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-2">Supplier Details (Optional)</h3>

                <div>
                    <label htmlFor="supplier_phone" className={labelClasses}>
                        Supplier Phone
                    </label>
                    <input
                        id="supplier_phone"
                        type="tel"
                        className={inputClasses}
                        placeholder="e.g., 09 123 4567"
                        {...register('supplier_phone')}
                    />
                </div>

                <div>
                    <label htmlFor="supplier_email" className={labelClasses}>
                        Supplier Email
                    </label>
                    <input
                        id="supplier_email"
                        type="email"
                        className={inputClasses}
                        placeholder="e.g., contact@supplier.com"
                        {...register('supplier_email', {
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Please enter a valid email address'
                            }
                        })}
                    />
                    {errors.supplier_email && <p className={errorClasses}>{errors.supplier_email.message}</p>}
                </div>
            </div>

            {/* Property Details Section */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-2">Property Details (Optional)</h3>

                <div>
                    <label htmlFor="property_address" className={labelClasses}>
                        Property Address
                    </label>
                    <textarea
                        id="property_address"
                        rows="2"
                        className={`${inputClasses} h-auto`}
                        placeholder="e.g., 123 Main Street, Auckland 1010"
                        {...register('property_address')}
                    />
                </div>

                <div>
                    <label htmlFor="property_phone" className={labelClasses}>
                        Property Phone
                    </label>
                    <input
                        id="property_phone"
                        type="tel"
                        className={inputClasses}
                        placeholder="e.g., 09 987 6543"
                        {...register('property_phone')}
                    />
                </div>
            </div>

            {/* Authorization Details Section */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-2">Authorization Details (Optional)</h3>

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
                        Authorized By
                    </label>
                    <input
                        id="authorized_by"
                        type="text"
                        className={inputClasses}
                        placeholder="e.g., Jane Manager"
                        {...register('authorized_by')}
                    />
                </div>

                <div>
                    <label htmlFor="authorized_contact" className={labelClasses}>
                        Authorized Contact
                    </label>
                    <input
                        id="authorized_contact"
                        type="tel"
                        className={inputClasses}
                        placeholder="e.g., 09 555 0123"
                        {...register('authorized_contact')}
                    />
                </div>

                <div>
                    <label htmlFor="authorized_email" className={labelClasses}>
                        Authorized Email
                    </label>
                    <input
                        id="authorized_email"
                        type="email"
                        className={inputClasses}
                        placeholder="e.g., manager@visionwest.org.nz"
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
