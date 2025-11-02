import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { quoteService } from '../../services/quoteService';

// T044: QuoteSummaryWidget component with status cards
const QuoteSummaryWidget = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    // T049: Role-based data fetching
    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            setLoading(true);
            const response = await quoteService.getQuoteSummary();
            if (response.success) {
                setSummary(response.data);
            }
        } catch (error) {
            console.error('Error loading quote summary:', error);
        } finally {
            setLoading(false);
        }
    };

    // T046: Navigate to filtered quotes list
    const handleCardClick = (status) => {
        navigate(`/quotes?status=${status}`);
    };

    const handleUrgentClick = () => {
        navigate('/quotes?urgency=true');
    };

    // T045: Status cards configuration with colors
    const statusCards = [
        {
            label: 'Draft',
            key: 'draft',
            color: 'bg-gray-100',
            textColor: 'text-gray-800',
            borderColor: 'border-gray-200',
            hoverColor: 'hover:bg-gray-200'
        },
        {
            label: 'Submitted',
            key: 'submitted',
            color: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            hoverColor: 'hover:bg-blue-200'
        },
        {
            label: 'Quoted',
            key: 'quoted',
            color: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            hoverColor: 'hover:bg-green-200'
        },
        {
            label: 'Approved',
            key: 'approved',
            color: 'bg-emerald-100',
            textColor: 'text-emerald-800',
            borderColor: 'border-emerald-200',
            hoverColor: 'hover:bg-emerald-200'
        },
        {
            label: 'Converted',
            key: 'converted',
            color: 'bg-nextgen-green bg-opacity-20',
            textColor: 'text-nextgen-green',
            borderColor: 'border-nextgen-green',
            hoverColor: 'hover:bg-nextgen-green hover:bg-opacity-30'
        },
        {
            label: 'Declined',
            key: 'declined',
            color: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            hoverColor: 'hover:bg-red-200'
        }
    ];

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-nextgen-green"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Widget Header - T048: New Quote Request button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Quote Requests</h2>
                {(user?.role === 'client_admin' || user?.role === 'admin') && (
                    <button
                        onClick={() => navigate('/quotes/new')}
                        className="bg-nextgen-green hover:bg-nextgen-green-dark text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        New
                    </button>
                )}
            </div>

            {/* T045, T050: Status cards with responsive grid layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                {statusCards.map((card) => (
                    <div
                        key={card.key}
                        onClick={() => handleCardClick(card.label)}
                        className={`${card.color} ${card.borderColor} ${card.hoverColor} border rounded-lg p-4 cursor-pointer transition-colors`}
                    >
                        <div className={`text-2xl font-bold ${card.textColor} mb-1`}>
                            {summary?.[card.key] || 0}
                        </div>
                        <div className={`text-xs font-medium ${card.textColor}`}>
                            {card.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* T047: Urgent quotes with red badge */}
            {summary?.urgent > 0 && (
                <div
                    onClick={handleUrgentClick}
                    className="bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold text-red-800">
                            {summary.urgent} Urgent Quote{summary.urgent !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        URGENT
                    </span>
                </div>
            )}

            {/* Total count and link to full list */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                    Total: <span className="font-semibold">{summary?.total || 0}</span> quotes
                </span>
                <button
                    onClick={() => navigate('/quotes')}
                    className="text-sm text-nextgen-green hover:text-nextgen-green-dark font-medium"
                >
                    View All →
                </button>
            </div>
        </div>
    );
};

export default QuoteSummaryWidget;
