import React, { useState } from 'react';

const NotesSection = ({ initialNotes = [], onSaveNotes }) => {
    const [noteContent, setNoteContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!noteContent.trim()) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSaveNotes(noteContent.trim());
            setNoteContent(''); // Clear form after successful submission
        } catch (err) {
            setError('Failed to add note. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-md font-semibold mb-3">Add Note</h2>

            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="mb-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mb-3">
                    <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Add a note about this work order..."
                        className="w-full border border-gray-300 rounded-md p-3 text-sm h-24 focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                        disabled={isSubmitting}
                    ></textarea>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className={`px-4 py-2 bg-nextgen-green text-pure-white rounded-md text-sm font-medium hover:bg-nextgen-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nextgen-green ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isSubmitting || !noteContent.trim()}
                    >
                        {isSubmitting ? 'Saving...' : 'Add Note'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NotesSection;