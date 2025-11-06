import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import quoteService from '../services/quoteService';

const QuoteMessages = ({ quoteId, currentUserId, canAddMessage = true }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (quoteId) {
            loadMessages();
        }
    }, [quoteId]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await quoteService.getMessages(quoteId);
            if (response.success) {
                setMessages(response.data || []);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) {
            toast.warning('Please enter a message');
            return;
        }

        try {
            setSending(true);
            const response = await quoteService.addMessage(quoteId, newMessage.trim());

            if (response.success) {
                toast.success('Message sent successfully');
                setNewMessage('');
                // Reload messages to show the new one
                await loadMessages();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const getMessageTypeLabel = (messageType) => {
        const labels = {
            'comment': '💬 Comment',
            'question': '❓ Question',
            'response': '💡 Response',
            'quote_provided': '📋 Quote Provided',
            'quote_updated': '✏️ Quote Updated',
            'approved': '✅ Approved',
            'declined_by_staff': '❌ Declined by Staff',
            'declined_by_client': '❌ Declined by Client',
            'info_requested': '📝 Info Requested',
            'expired': '⏰ Expired',
            'renewed': '🔄 Renewed',
            'status_change': '🔄 Status Changed',
            'converted': '🔄 Converted to Work Order'
        };
        return labels[messageType] || messageType;
    };

    const isSystemMessage = (messageType) => {
        return !['comment', 'question', 'response'].includes(messageType);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Activity & Messages</h3>
                <p className="text-gray-500">Loading messages...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">
                Activity & Messages ({messages.length})
            </h3>

            {/* Messages List */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">
                        No messages yet. Be the first to comment!
                    </p>
                ) : (
                    messages.map((message) => {
                        const isSystem = isSystemMessage(message.messageType);
                        const isOwnMessage = message.user?.id === currentUserId;

                        return (
                            <div
                                key={message.id}
                                className={`p-4 rounded-lg border ${
                                    isSystem
                                        ? 'bg-blue-50 border-blue-200'
                                        : isOwnMessage
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-gray-50 border-gray-200'
                                }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">
                                                {message.user?.name || 'Unknown User'}
                                            </span>
                                            <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-300">
                                                {message.user?.role || 'user'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(message.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">
                                        {getMessageTypeLabel(message.messageType)}
                                    </span>
                                </div>

                                {/* Message Content */}
                                <div className="text-gray-800 whitespace-pre-wrap break-words">
                                    {message.message}
                                </div>

                                {/* Cost/Hours Changes (if applicable) */}
                                {(message.previousCost || message.newCost) && (
                                    <div className="mt-3 pt-3 border-t border-gray-300 text-sm">
                                        {message.previousCost && message.newCost && (
                                            <p className="text-gray-600">
                                                💰 Cost: <span className="line-through">${parseFloat(message.previousCost).toFixed(2)}</span>{' '}
                                                → <span className="font-semibold text-green-600">${parseFloat(message.newCost).toFixed(2)}</span>
                                            </p>
                                        )}
                                        {message.previousHours && message.newHours && (
                                            <p className="text-gray-600">
                                                ⏱️ Hours: <span className="line-through">{parseFloat(message.previousHours).toFixed(1)}h</span>{' '}
                                                → <span className="font-semibold text-green-600">{parseFloat(message.newHours).toFixed(1)}h</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Message Form - Only show if allowed */}
            {canAddMessage ? (
                <form onSubmit={handleSendMessage} className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add a comment
                    </label>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent resize-none"
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="px-4 py-2 bg-nextgen-green text-white rounded-lg hover:bg-nextgen-green-dark disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {sending ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 text-center py-2">
                        This quote is closed. No new messages can be added.
                    </p>
                </div>
            )}
        </div>
    );
};

export default QuoteMessages;
