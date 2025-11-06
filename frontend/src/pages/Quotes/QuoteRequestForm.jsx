import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppHeader from '../../components/layout/AppHeader';
import MobileNavigation from '../../components/layout/MobileNavigation';
import ThumbnailGallery from '../../components/ThumbnailGallery';
import { quoteService } from '../../services/quoteService';
import { toast } from 'react-toastify';

// T020: QuoteRequestForm component with all required fields
const QuoteRequestForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const isEditMode = Boolean(id);

    // T020: Form state with all required fields
    const [formData, setFormData] = useState({
        property_name: '',
        property_address: '',
        title: '',
        work_type: '',
        description: '',
        scope_of_work: '',
        contact_person: '',
        contact_phone: '',
        contact_email: '',
        is_urgent: false,
        required_by_date: '',
        special_instructions: ''
    });

    const [errors, setErrors] = useState({});

    // T005: Attachment state management
    const [attachments, setAttachments] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});

    // Load existing quote if editing
    useEffect(() => {
        if (isEditMode) {
            loadQuote();
            loadAttachments();
        }
    }, [id]);

    // T054-T055: Warn user before navigating away with unsaved attachments
    useEffect(() => {
        const hasUnsavedFiles = attachments.length > 0 || selectedFiles.length > 0;

        const handleBeforeUnload = (e) => {
            if (hasUnsavedFiles && !isEditMode) {
                e.preventDefault();
                e.returnValue = 'You have uploaded files. If you leave without saving, they will be lost.';
                return e.returnValue;
            }
        };

        if (hasUnsavedFiles && !isEditMode) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [attachments, selectedFiles, isEditMode]);

    const loadQuote = async () => {
        try {
            setLoading(true);
            const response = await quoteService.getQuoteById(id);
            if (response.success) {
                const quote = response.data;
                setFormData({
                    property_name: quote.property_name || '',
                    property_address: quote.property_address || '',
                    title: quote.title || '',
                    work_type: quote.work_type || '',
                    description: quote.description || '',
                    scope_of_work: quote.scope_of_work || '',
                    contact_person: quote.contact_person || '',
                    contact_phone: quote.contact_phone || '',
                    contact_email: quote.contact_email || '',
                    is_urgent: quote.is_urgent || false,
                    required_by_date: quote.required_by_date || '',
                    special_instructions: quote.special_instructions || ''
                });
            }
        } catch (error) {
            console.error('Error loading quote:', error);
            toast.error('Failed to load quote');
        } finally {
            setLoading(false);
        }
    };

    // Load attachments for existing quote
    const loadAttachments = async () => {
        if (!id) return;
        try {
            const response = await quoteService.getAttachments(id);
            if (response.success) {
                setAttachments(response.data || []);
            }
        } catch (error) {
            console.error('Error loading attachments:', error);
        }
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    // T021: Validation
    const validate = () => {
        const newErrors = {};

        if (!formData.property_name?.trim()) {
            newErrors.property_name = 'Property name is required';
        }

        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.description?.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 20) {
            newErrors.description = 'Description must be at least 20 characters';
        }

        if (!formData.contact_person?.trim()) {
            newErrors.contact_person = 'Contact name is required';
        }

        if (!formData.contact_email?.trim()) {
            newErrors.contact_email = 'Contact email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
            newErrors.contact_email = 'Valid email is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // T008: File validation
    const validateFile = (file) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ];

        if (file.size > maxSize) {
            return `File "${file.name}" is too large. Maximum size is 10MB.`;
        }

        if (!allowedTypes.includes(file.type)) {
            return `File "${file.name}" has an invalid type. Only images and documents (PDF, Word, Excel, Text) are allowed.`;
        }

        return null;
    };

    // T008: Handle file selection
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);

        // Check total file limit (5 files max)
        if (attachments.length + selectedFiles.length + files.length > 5) {
            toast.error('Maximum 5 files allowed per quote');
            return;
        }

        // Validate each file
        const validFiles = [];
        for (const file of files) {
            const error = validateFile(file);
            if (error) {
                toast.error(error);
            } else {
                validFiles.push(file);
            }
        }

        if (validFiles.length > 0) {
            setSelectedFiles([...selectedFiles, ...validFiles]);
        }
    };

    // T009-T011: Upload files
    const handleUploadFiles = async (quoteId) => {
        if (selectedFiles.length === 0) return;

        try {
            setUploading(true);
            const response = await quoteService.uploadAttachments(quoteId, selectedFiles);

            if (response.success) {
                // Reload attachments to get the uploaded files
                await loadAttachments();
                // Clear selected files
                setSelectedFiles([]);
                // Reset file input
                const fileInput = document.getElementById('attachment-file-input');
                if (fileInput) fileInput.value = '';
            }
        } catch (error) {
            console.error('Error uploading attachments:', error);
            toast.error('Failed to upload some files. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Remove file from selected files list (before upload)
    const handleRemoveSelectedFile = (index) => {
        const newSelectedFiles = [...selectedFiles];
        newSelectedFiles.splice(index, 1);
        setSelectedFiles(newSelectedFiles);
    };

    // Delete uploaded attachment
    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm('Are you sure you want to delete this attachment?')) {
            return;
        }

        try {
            await quoteService.deleteAttachment(attachmentId);
            await loadAttachments();
            toast.success('Attachment deleted successfully');
        } catch (error) {
            console.error('Error deleting attachment:', error);
        }
    };

    // Format file size for display
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // T015: Save as draft with attachments
    const handleSaveDraft = async () => {
        try {
            setSaving(true);
            let response;
            let quoteId = id;

            if (isEditMode) {
                response = await quoteService.updateQuote(id, formData);
            } else {
                response = await quoteService.createQuote(formData);
                if (response.success && response.data?.id) {
                    quoteId = response.data.id;
                }
            }

            if (response.success) {
                // Upload any selected files
                if (selectedFiles.length > 0 && quoteId) {
                    await handleUploadFiles(quoteId);
                }

                toast.success('Draft saved successfully');
                if (!isEditMode && quoteId) {
                    navigate(`/quotes/${quoteId}/edit`);
                }
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            toast.error('Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    // T056: Handle cancel with confirmation if attachments exist
    const handleCancel = () => {
        const hasFiles = attachments.length > 0 || selectedFiles.length > 0;

        if (hasFiles && !isEditMode) {
            const confirmed = window.confirm(
                'You have uploaded files. If you cancel without saving, they will be lost. Are you sure you want to cancel?'
            );
            if (!confirmed) return;
        }

        navigate('/quotes');
    };

    // T016: Submit quote with attachments
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        // T013: Prevent submission while uploading
        if (uploading) {
            toast.warning('Please wait for file uploads to complete');
            return;
        }

        try {
            setSaving(true);
            let quoteId = id;

            // If new quote, create it first
            if (!isEditMode) {
                const createResponse = await quoteService.createQuote(formData);
                if (!createResponse.success) {
                    throw new Error('Failed to create quote');
                }
                quoteId = createResponse.data.id;
            } else {
                // Update existing draft
                await quoteService.updateQuote(id, formData);
            }

            // Upload any selected files before submitting
            if (selectedFiles.length > 0 && quoteId) {
                await handleUploadFiles(quoteId);
            }

            // Submit the quote
            const submitResponse = await quoteService.submitQuote(quoteId);
            if (submitResponse.success) {
                navigate('/quotes');
            }
        } catch (error) {
            console.error('Error submitting quote:', error);
            toast.error('Failed to submit quote');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <AppHeader title="Quote Request" />
                <div className="pt-16 pb-20 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nextgen-green"></div>
                </div>
                <MobileNavigation />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AppHeader title={isEditMode ? 'Edit Quote Request' : 'New Quote Request'} />

            <main className="pt-16 pb-20 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* T025: Mobile-responsive form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">

                        {/* Property Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Property Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="property_name"
                                        value={formData.property_name}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent ${errors.property_name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="e.g., Main Office Building"
                                    />
                                    {errors.property_name && (
                                        <p className="text-red-500 text-sm mt-1">{errors.property_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Property Address
                                    </label>
                                    <input
                                        type="text"
                                        name="property_address"
                                        value={formData.property_address}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                                        placeholder="Full address"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Work Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Brief summary of work needed"
                                        maxLength={200}
                                    />
                                    {errors.title && (
                                        <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type of Work
                                    </label>
                                    <select
                                        name="work_type"
                                        value={formData.work_type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                                    >
                                        <option value="">Select work type...</option>
                                        <option value="Full property clean up inside and out">Full property clean up inside and out</option>
                                        <option value="Rubbish removal">Rubbish removal</option>
                                        <option value="Pressure Washing">Pressure Washing</option>
                                        <option value="Garden services">Garden services</option>
                                        <option value="Handyman">Handyman</option>
                                        <option value="Carpet cleaning">Carpet cleaning</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Fencing">Fencing</option>
                                        <option value="Painting">Painting</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description <span className="text-red-500">*</span>
                                        <span className="text-gray-500 text-xs ml-1">(min 20 characters)</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Detailed description of the work required"
                                        maxLength={2000}
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                        {errors.description ? (
                                            <p className="text-red-500 text-sm">{errors.description}</p>
                                        ) : (
                                            <span className="text-gray-500 text-xs">
                                                {formData.description.length}/2000
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Scope of Work
                                    </label>
                                    <textarea
                                        name="scope_of_work"
                                        value={formData.scope_of_work}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                                        placeholder="Expected scope and deliverables"
                                        maxLength={2000}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent ${errors.contact_person ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Primary contact person"
                                    />
                                    {errors.contact_person && (
                                        <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={formData.contact_email}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent ${errors.contact_email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="email@example.com"
                                    />
                                    {errors.contact_email && (
                                        <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="contact_phone"
                                        value={formData.contact_phone}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                                        placeholder="+64 21 123 4567"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>

                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_urgent"
                                        checked={formData.is_urgent}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-nextgen-green focus:ring-nextgen-green border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-900">
                                        Mark as urgent (requires immediate attention)
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Required By Date
                                    </label>
                                    <input
                                        type="date"
                                        name="required_by_date"
                                        value={formData.required_by_date}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Special Instructions
                                    </label>
                                    <textarea
                                        name="special_instructions"
                                        value={formData.special_instructions}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                                        placeholder="Any special requirements or instructions"
                                        maxLength={1000}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* T006-T007: Attachments Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Attachments ({attachments.length + selectedFiles.length}/5)
                            </h3>

                            {/* File Upload Input */}
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Files (Optional)
                                </label>
                                <input
                                    id="attachment-file-input"
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                    onChange={handleFileSelect}
                                    disabled={attachments.length + selectedFiles.length >= 5}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-nextgen-green file:text-white hover:file:bg-nextgen-green-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Supported formats: Images, PDF, Word, Excel, Text (Max 10MB per file, 5 files maximum)
                                </p>
                            </div>

                            {/* T012: Selected Files (Not Yet Uploaded) */}
                            {selectedFiles.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Files Ready to Upload ({selectedFiles.length})
                                    </p>
                                    <div className="space-y-2">
                                        {selectedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                                            >
                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                    <span className="text-2xl">📎</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSelectedFile(index)}
                                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                        These files will be uploaded when you save the draft or submit the quote.
                                    </p>
                                </div>
                            )}

                            {/* T010: Upload Progress Indicator */}
                            {uploading && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-nextgen-green"></div>
                                        <p className="text-sm text-gray-700">Uploading files...</p>
                                    </div>
                                </div>
                            )}

                            {/* T035-T037: Uploaded Attachments with ThumbnailGallery */}
                            {attachments.length > 0 && (
                                <div>
                                    <ThumbnailGallery
                                        attachments={attachments}
                                        onDelete={handleDeleteAttachment}
                                        showDelete={true}
                                    />
                                </div>
                            )}

                            {/* Empty State */}
                            {attachments.length === 0 && selectedFiles.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No files attached yet. You can add photos and documents to support your quote request.
                                </p>
                            )}
                        </div>

                        {/* T013-T014: Action Buttons with upload state handling */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                                disabled={saving || uploading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50"
                                disabled={saving || uploading}
                            >
                                {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Draft'}
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-nextgen-green text-white rounded-lg hover:bg-nextgen-green-dark font-medium disabled:opacity-50"
                                disabled={saving || uploading}
                            >
                                {saving ? 'Submitting...' : uploading ? 'Uploading...' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <MobileNavigation />
        </div>
    );
};

export default QuoteRequestForm;
