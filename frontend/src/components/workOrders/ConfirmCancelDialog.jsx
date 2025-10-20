import React, { useState } from 'react';
import ReactDOM from 'react-dom';

/**
 * ConfirmCancelDialog - Confirmation dialog for work order cancellation
 * 
 * Uses React portals to render modal at document.body level
 * Follows NextGen WOM design system with mobile-first approach
 * 
 * @param {boolean} isOpen - Controls dialog visibility
 * @param {function} onConfirm - Callback when user confirms cancellation (receives notes parameter)
 * @param {function} onCancel - Callback when user dismisses dialog
 * @param {number} workOrderId - Work order ID being cancelled
 * @param {string} userRole - Current user's role (client, client_admin, staff, admin)
 */
const ConfirmCancelDialog = ({ isOpen, onConfirm, onCancel, workOrderId, userRole }) => {
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        // ALL users must provide notes for cancellation
        if (!notes.trim()) {
            setError('Please provide a reason for cancellation');
            return;
        }
        onConfirm(notes);
        setNotes(''); // Reset for next time
        setError('');
    };

    const handleCancel = () => {
        setNotes('');
        setError('');
        onCancel();
    };

    // Render dialog using React portals for proper z-index layering
    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-rich-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCancel} // Close on backdrop click
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-dialog-title"
        >
            <div
                className="bg-pure-white rounded-lg max-w-md w-full p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing when clicking dialog content
            >
                {/* Header */}
                <div className="mb-4">
                    <h3
                        id="cancel-dialog-title"
                        className="text-lg font-semibold text-deep-navy mb-2"
                    >
                        Cancel Work Order?
                    </h3>
                    <p className="text-rich-black text-sm">
                        Please provide a reason for cancelling this work order.
                    </p>
                </div>

                {/* Notes input - REQUIRED for ALL users */}
                <div className="mb-4">
                    <label htmlFor="cancel-notes" className="block text-sm font-medium text-rich-black mb-2">
                        Reason for Cancellation *
                    </label>
                    <textarea
                        id="cancel-notes"
                        value={notes}
                        onChange={(e) => {
                            setNotes(e.target.value);
                            setError(''); // Clear error when user types
                        }}
                        placeholder="Please explain why you need to cancel this work order..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-navy min-h-[100px]"
                        aria-required="true"
                        aria-describedby={error ? "cancel-notes-error" : undefined}
                    />
                    {error && (
                        <p id="cancel-notes-error" className="mt-1 text-sm text-red-600">
                            {error}
                        </p>
                    )}
                </div>

                {/* Warning message */}
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
                    <p className="text-red-700 text-sm font-medium">
                        ⚠️ Permanent Action
                    </p>
                    <p className="text-red-600 text-xs mt-1">
                        Cancelled work orders cannot be reactivated. If work needs to resume, you'll need to create a new work order.
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-3 bg-gray-200 text-rich-black rounded-md hover:bg-gray-300 transition-colors duration-150 min-h-[44px] font-medium"
                        aria-label="Keep work order active"
                    >
                        No, Keep It
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-3 bg-red-600 text-pure-white rounded-md hover:bg-red-700 transition-colors duration-150 min-h-[44px] font-medium"
                        aria-label="Confirm cancellation"
                    >
                        Yes, Cancel It
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmCancelDialog;
