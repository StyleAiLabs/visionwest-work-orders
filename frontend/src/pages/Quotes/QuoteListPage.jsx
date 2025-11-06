import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppHeader from '../../components/layout/AppHeader';
import MobileNavigation from '../../components/layout/MobileNavigation';
import { quoteService } from '../../services/quoteService';

// T036: Status badge component with colors
const QuoteStatusBadge = ({ status, isUrgent }) => {
    const statusColors = {
        'Draft': 'bg-gray-100 text-gray-800',
        'Submitted': 'bg-blue-100 text-blue-800',
        'Information Requested': 'bg-yellow-100 text-yellow-800',
        'Quoted': 'bg-green-100 text-green-800',
        'Under Discussion': 'bg-amber-100 text-amber-800',
        'Approved': 'bg-emerald-100 text-emerald-800',
        'Declined': 'bg-red-100 text-red-800',
        'Expired': 'bg-red-200 text-red-900',
        'Converted': 'bg-nextgen-green bg-opacity-20 text-nextgen-green'
    };

    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';

    return (
        <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                {status}
            </span>
            {/* T041: Urgent badge with flame icon */}
            {isUrgent && (
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                    URGENT
                </span>
            )}
        </div>
    );
};

// T035: Quote card component for mobile view
const QuoteCard = ({ quote, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-semibold text-gray-900">{quote.quote_number || 'Draft'}</h3>
                    <p className="text-sm text-gray-600">{quote.property_name}</p>
                </div>
                <QuoteStatusBadge status={quote.status} isUrgent={quote.is_urgent} />
            </div>
            <p className="text-sm text-gray-700 line-clamp-2 mb-2">{quote.title}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                {quote.client?.name && (
                    <span className="font-medium">{quote.client.name}</span>
                )}
            </div>
        </div>
    );
};

const QuoteListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(() => ({
        status: searchParams.get('status') || '',
        urgency: searchParams.get('urgency') || '',
        search: searchParams.get('search') || '',
        page: 1,
        limit: 20
    }));
    const [pagination, setPagination] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Load quotes
    useEffect(() => {
        loadQuotes();
    }, [filters]);

    const loadQuotes = async () => {
        try {
            setLoading(true);
            const response = await quoteService.getQuotes(filters);
            console.log('=== QUOTE LIST DEBUG ===');
            console.log('API Response:', response);
            console.log('Quotes data:', response.data);
            console.log('Quotes length:', response.data?.length);
            console.log('Pagination:', response.pagination);
            if (response.success) {
                setQuotes(response.data);
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error('Error loading quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    // T038: Handle search
    const handleSearch = (e) => {
        setFilters({ ...filters, search: e.target.value, page: 1 });
    };

    // T037: Handle status filter
    const handleStatusFilter = (status) => {
        setFilters({ ...filters, status: status === filters.status ? '' : status, page: 1 });
    };

    // Handle urgency filter
    const handleUrgencyFilter = () => {
        setFilters({ ...filters, urgency: filters.urgency ? '' : 'true', page: 1 });
    };

    // T037: Clear all filters
    const clearFilters = () => {
        setFilters({ status: '', urgency: '', search: '', page: 1, limit: 20 });
    };

    // T039: Pagination handlers
    const handleNextPage = () => {
        if (pagination && pagination.page < pagination.totalPages) {
            setFilters({ ...filters, page: filters.page + 1 });
        }
    };

    const handlePrevPage = () => {
        if (pagination && pagination.page > 1) {
            setFilters({ ...filters, page: filters.page - 1 });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AppHeader title="Quotes" />

            <main className="pt-16 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header with New Quote Button - T040 */}
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
                        {(user?.role === 'client_admin' || user?.role === 'admin') && (
                            <button
                                onClick={() => navigate('/quotes/new')}
                                className="bg-nextgen-green hover:bg-nextgen-green-dark text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">New Quote</span>
                            </button>
                        )}
                    </div>

                    {/* T038: Search bar */}
                    <div className="mb-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by quote number, property, or description..."
                                value={filters.search}
                                onChange={handleSearch}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                            />
                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* T037: Filters */}
                    <div className="mb-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-sm text-gray-700 flex items-center gap-2 mb-2"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters {(filters.status || filters.urgency) && `(${[filters.status, filters.urgency].filter(Boolean).length})`}
                        </button>

                        {showFilters && (
                            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <button onClick={() => handleStatusFilter('Submitted')} className={`px-3 py-1 rounded-full text-sm ${filters.status === 'Submitted' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}>
                                        Submitted
                                    </button>
                                    <button onClick={() => handleStatusFilter('Quoted')} className={`px-3 py-1 rounded-full text-sm ${filters.status === 'Quoted' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`}>
                                        Quoted
                                    </button>
                                    <button onClick={() => handleStatusFilter('Approved')} className={`px-3 py-1 rounded-full text-sm ${filters.status === 'Approved' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                                        Approved
                                    </button>
                                    <button onClick={() => handleStatusFilter('Converted')} className={`px-3 py-1 rounded-full text-sm ${filters.status === 'Converted' ? 'bg-nextgen-green text-white' : 'bg-nextgen-green bg-opacity-20 text-nextgen-green'}`}>
                                        Converted
                                    </button>
                                    <button onClick={() => handleStatusFilter('Declined')} className={`px-3 py-1 rounded-full text-sm ${filters.status === 'Declined' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'}`}>
                                        Declined
                                    </button>
                                    <button onClick={handleUrgencyFilter} className={`px-3 py-1 rounded-full text-sm ${filters.urgency ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                        Urgent Only
                                    </button>
                                </div>
                                <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-900">
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Results count */}
                    {pagination && (
                        <p className="text-sm text-gray-600 mb-4">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} quotes
                        </p>
                    )}

                    {/* Loading state */}
                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nextgen-green"></div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && quotes.length === 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                            <svg className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
                            <p className="text-gray-600">
                                {filters.search || filters.status || filters.urgency
                                    ? 'Try adjusting your filters'
                                    : 'Get started by creating your first quote request'}
                            </p>
                        </div>
                    )}

                    {/* T035: Quote cards (mobile view) */}
                    {!loading && quotes.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 mb-6">
                            {quotes.map((quote) => (
                                <QuoteCard
                                    key={quote.id}
                                    quote={quote}
                                    onClick={() => navigate(`/quotes/${quote.id}`)}
                                />
                            ))}
                        </div>
                    )}

                    {/* T039: Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={handlePrevPage}
                                disabled={pagination.page === 1}
                                className={`px-4 py-2 rounded-lg ${pagination.page === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={pagination.page === pagination.totalPages}
                                className={`px-4 py-2 rounded-lg ${pagination.page === pagination.totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <MobileNavigation />
        </div>
    );
};

export default QuoteListPage;
