import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppHeader from '../../components/layout/AppHeader';
import MobileNavigation from '../../components/layout/MobileNavigation';
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

    // Load existing quote if editing
    useEffect(() => {
        if (isEditMode) {
            loadQuote();
        }
    }, [id]);

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

    // T023: Save as draft
    const handleSaveDraft = async () => {
        try {
            setSaving(true);
            let response;

            if (isEditMode) {
                response = await quoteService.updateQuote(id, formData);
            } else {
                response = await quoteService.createQuote(formData);
            }

            if (response.success) {
                toast.success('Draft saved successfully');
                if (!isEditMode && response.data?.id) {
                    navigate(`/quotes/${response.data.id}/edit`);
                }
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            toast.error('Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    // T023: Submit quote
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors before submitting');
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

                        {/* T023: Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/quotes')}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-nextgen-green text-white rounded-lg hover:bg-nextgen-green-dark font-medium disabled:opacity-50"
                                disabled={saving}
                            >
                                {saving ? 'Submitting...' : 'Submit'}
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
