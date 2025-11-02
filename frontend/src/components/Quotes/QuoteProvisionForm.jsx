import React, { useState } from 'react';
import { quoteService } from '../../services/quoteService';
import { toast } from 'react-toastify';

// T060: QuoteProvisionForm component
const QuoteProvisionForm = ({ quote, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        estimated_cost: '',
        estimated_hours: '',
        quote_notes: '',
        quote_valid_until: '',
        itemized_breakdown: []
    });
    const [errors, setErrors] = useState({});

    // T061: Itemized breakdown state
    const [showItemizedBreakdown, setShowItemizedBreakdown] = useState(false);
    const [breakdownItem, setBreakdownItem] = useState({
        category: 'materials',
        description: '',
        cost: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    const handleAddBreakdownItem = () => {
        if (!breakdownItem.description || !breakdownItem.cost) {
            toast.error('Please fill in description and cost');
            return;
        }

        const newItem = {
            category: breakdownItem.category,
            description: breakdownItem.description,
            cost: parseFloat(breakdownItem.cost)
        };

        setFormData({
            ...formData,
            itemized_breakdown: [...formData.itemized_breakdown, newItem]
        });

        // Reset breakdown item form
        setBreakdownItem({
            category: 'materials',
            description: '',
            cost: ''
        });
    };

    const handleRemoveBreakdownItem = (index) => {
        const updated = formData.itemized_breakdown.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            itemized_breakdown: updated
        });
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.estimated_cost || parseFloat(formData.estimated_cost) <= 0) {
            newErrors.estimated_cost = 'Estimated cost must be greater than 0';
        }

        if (!formData.estimated_hours || parseFloat(formData.estimated_hours) <= 0) {
            newErrors.estimated_hours = 'Estimated hours must be greater than 0';
        }

        if (formData.quote_valid_until) {
            const validityDate = new Date(formData.quote_valid_until);
            const now = new Date();
            if (validityDate <= now) {
                newErrors.quote_valid_until = 'Validity date must be in the future';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        try {
            setLoading(true);

            const quoteDetails = {
                estimated_cost: parseFloat(formData.estimated_cost),
                estimated_hours: parseFloat(formData.estimated_hours),
                quote_notes: formData.quote_notes || null,
                quote_valid_until: formData.quote_valid_until || null,
                itemized_breakdown: formData.itemized_breakdown.length > 0
                    ? formData.itemized_breakdown
                    : null
            };

            const response = await quoteService.provideQuote(quote.id, quoteDetails);

            if (response.success) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error providing quote:', error);
            // Error toast already shown by service
        } finally {
            setLoading(false);
        }
    };

    const totalBreakdownCost = formData.itemized_breakdown.reduce(
        (sum, item) => sum + parseFloat(item.cost),
        0
    );

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Provide Quote</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cost and Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estimated Cost ($) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="estimated_cost"
                            value={formData.estimated_cost}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent ${
                                errors.estimated_cost ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., 5000.00"
                        />
                        {errors.estimated_cost && (
                            <p className="text-red-500 text-sm mt-1">{errors.estimated_cost}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estimated Hours <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="estimated_hours"
                            value={formData.estimated_hours}
                            onChange={handleChange}
                            step="0.5"
                            min="0"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent ${
                                errors.estimated_hours ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., 20"
                        />
                        {errors.estimated_hours && (
                            <p className="text-red-500 text-sm mt-1">{errors.estimated_hours}</p>
                        )}
                    </div>
                </div>

                {/* Quote Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quote Notes
                    </label>
                    <textarea
                        name="quote_notes"
                        value={formData.quote_notes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                        placeholder="Includes materials, labor, permits, etc."
                    />
                </div>

                {/* Validity Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quote Valid Until
                    </label>
                    <input
                        type="date"
                        name="quote_valid_until"
                        value={formData.quote_valid_until}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent ${
                            errors.quote_valid_until ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.quote_valid_until && (
                        <p className="text-red-500 text-sm mt-1">{errors.quote_valid_until}</p>
                    )}
                </div>

                {/* T061: Itemized Breakdown (Optional) */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowItemizedBreakdown(!showItemizedBreakdown)}
                        className="text-sm text-nextgen-green hover:text-nextgen-green-dark font-medium flex items-center gap-2"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showItemizedBreakdown ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                        </svg>
                        Add Itemized Breakdown (Optional)
                    </button>

                    {showItemizedBreakdown && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <select
                                    value={breakdownItem.category}
                                    onChange={(e) => setBreakdownItem({ ...breakdownItem, category: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="materials">Materials</option>
                                    <option value="labor">Labor</option>
                                    <option value="subcontractor">Subcontractor</option>
                                    <option value="permits">Permits/Fees</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="other">Other</option>
                                </select>

                                <input
                                    type="text"
                                    value={breakdownItem.description}
                                    onChange={(e) => setBreakdownItem({ ...breakdownItem, description: e.target.value })}
                                    placeholder="Description"
                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                />

                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={breakdownItem.cost}
                                        onChange={(e) => setBreakdownItem({ ...breakdownItem, cost: e.target.value })}
                                        placeholder="Cost"
                                        step="0.01"
                                        min="0"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddBreakdownItem}
                                        className="px-3 py-2 bg-nextgen-green text-white rounded-lg hover:bg-nextgen-green-dark"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Breakdown Items List */}
                            {formData.itemized_breakdown.length > 0 && (
                                <div className="space-y-2">
                                    {formData.itemized_breakdown.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg">
                                            <div>
                                                <span className="text-xs font-medium text-gray-600 uppercase">{item.category}</span>
                                                <p className="text-sm text-gray-900">{item.description}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-gray-900">${parseFloat(item.cost).toFixed(2)}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveBreakdownItem(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                                        <span className="font-semibold text-gray-700">Total Breakdown:</span>
                                        <span className="font-bold text-gray-900">${totalBreakdownCost.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-nextgen-green text-white rounded-lg hover:bg-nextgen-green-dark font-medium disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Providing Quote...' : 'Provide Quote'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuoteProvisionForm;
