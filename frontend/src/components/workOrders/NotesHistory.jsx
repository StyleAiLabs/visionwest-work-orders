import React from 'react';
import { format } from 'date-fns';

const NotesHistory = ({ notes = [], statusUpdates = [] }) => {
    // Format date helper
    const formatDate = (dateString) => {
        try {
            if (!dateString) return '';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return format(date, 'dd MMM yyyy, h:mm a');
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    };

    // Combine notes and status updates into a single timeline
    const createTimeline = () => {
        const statusNotes = statusUpdates
            .filter(update => update.notes && update.notes.trim() !== '')
            .map(update => ({
                id: `status-${update.id}`,
                content: update.notes,
                type: 'status',
                status: update.newStatus,
                previousStatus: update.previousStatus,
                createdAt: update.updatedAt,
                user: update.updatedBy ? update.updatedBy.name : 'Unknown',
                timestamp: new Date(update.updatedAt).getTime()
            }));

        const generalNotes = notes.map(note => ({
            id: `note-${note.id}`,
            content: note.content,
            type: 'note',
            createdAt: note.createdAt,
            user: note.createdBy ? note.createdBy.name : 'Unknown',
            timestamp: new Date(note.createdAt).getTime()
        }));

        // Combine and sort by timestamp (newest first)
        return [...statusNotes, ...generalNotes]
            .sort((a, b) => b.timestamp - a.timestamp);
    };

    const timeline = createTimeline();

    if (timeline.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <h2 className="text-md font-semibold mb-3">Notes History</h2>
                <p className="text-sm text-gray-500 italic">No notes available</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-md font-semibold mb-3">Notes History</h2>

            <div className="space-y-4">
                {timeline.map(item => (
                    <div
                        key={item.id}
                        className={`p-3 rounded-lg border-l-4 ${item.type === 'status'
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-green-400 bg-green-50'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{item.user}</span>
                                {item.type === 'status' && (
                                    <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">
                                        Status Update
                                    </span>
                                )}
                                {item.type === 'note' && (
                                    <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Note
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                        </div>

                        {item.type === 'status' && (
                            <div className="text-xs text-gray-500 mb-1">
                                Status changed from <span className="font-medium">{item.previousStatus}</span> to <span className="font-medium">{item.status}</span>
                            </div>
                        )}

                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotesHistory;