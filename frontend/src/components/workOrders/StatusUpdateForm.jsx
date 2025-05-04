import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth'; // Fix the import path

const StatusUpdateForm = ({ initialStatus, onSubmit, onCancel, showNotes = true }) => {
    const { user } = useAuth();

    // If user is client, don't render the form
    if (user && user.role === 'client') {
        return null;
    }

    const [notes, setNotes] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(initialStatus);

    const handleSubmit = () => {
        onSubmit(selectedStatus, notes);
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-md font-semibold mb-3">Update Status</h3>

            <div className="flex gap-2 mb-4">
                <button
                    className={`flex-1 font-medium py-2 px-3 rounded-md text-sm border-2 ${selectedStatus === 'pending'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-white text-amber-800 border-gray-300'
                        }`}
                    onClick={() => setSelectedStatus('pending')}
                    type="button"
                >
                    Pending
                </button>
                <button
                    className={`flex-1 font-medium py-2 px-3 rounded-md text-sm border-2 ${selectedStatus === 'in-progress'
                        ? 'bg-vw-green-light text-vw-dark border-vw-green'
                        : 'bg-white text-vw-dark border-gray-300'
                        }`}
                    onClick={() => setSelectedStatus('in-progress')}
                    type="button"
                >
                    In Progress
                </button>
                <button
                    className={`flex-1 font-medium py-2 px-3 rounded-md text-sm border-2 ${selectedStatus === 'completed'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-white text-green-800 border-gray-300'
                        }`}
                    onClick={() => setSelectedStatus('completed')}
                    type="button"
                >
                    Completed
                </button>
            </div>

            {showNotes && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status Notes (Optional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                        placeholder="Add any notes about this status change"
                        rows="3"
                    />
                </div>
            )}

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    type="button"
                    className="px-4 py-2 bg-vw-green hover:bg-vw-green-dark text-white rounded-md text-sm font-medium"
                >
                    Update Status
                </button>
            </div>
        </div>
    );
};

export default StatusUpdateForm;