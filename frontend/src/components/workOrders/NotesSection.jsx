import React, { useState } from 'react';
import Button from '../common/Button';

const NotesSection = ({ initialNotes = '', onSaveNotes }) => {
    const [notes, setNotes] = useState(initialNotes);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveNotes(notes);
        } catch (error) {
            console.error('Error saving notes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-md font-semibold mb-3">Notes</h2>
            <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                rows="3"
                placeholder="Add notes about the work order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            ></textarea>
            <Button
                type="button"
                fullWidth
                onClick={handleSave}
                disabled={isSaving}
            >
                {isSaving ? 'Saving...' : 'Save Notes'}
            </Button>
        </div>
    );
};

export default NotesSection;