import React, { useState } from 'react';

const ClientStatusUpdateForm = ({ onSubmit, onCancel }) => {
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        onSubmit('cancelled', notes);
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-md font-semibold mb-3">Request Work Order Cancellation</h3>

            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-gray-700 mb-2">
                    Are you sure you want to request cancellation of this work order?
                </p>
                <p className="text-xs text-gray-500">
                    Please provide a reason for the cancellation request. The maintenance team will be notified.
                </p>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="Please explain why you'd like to cancel this work order"
                    rows="3"
                    required
                />
            </div>

            <div className="flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Back
                </button>
                <button
                    onClick={handleSubmit}
                    type="button"
                    disabled={!notes.trim()}
                    className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium ${!notes.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Request Cancellation
                </button>
            </div>
        </div>
    );
};

export default ClientStatusUpdateForm;