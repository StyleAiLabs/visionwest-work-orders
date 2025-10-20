import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import WorkOrderCard from '../components/workOrders/WorkOrderCard';
import FilterBar from '../components/workOrders/FilterBar';
import AuthorizedPersonFilter from '../components/workOrders/AuthorizedPersonFilter';
import ClientFilter from '../components/workOrders/ClientFilter';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { workOrderService } from '../services/workOrderService';
import { useAuth } from '../hooks/useAuth';

const WorkOrdersPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [workOrders, setWorkOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clientId, setClientId] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        authorized_person: '',
        page: 1,
        limit: 5
    });
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Check if user is client_admin (tenancy manager)
    const isClientAdmin = user && user.role === 'client_admin';

    // Initialize clientId based on user role when user loads
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                // Admin: Load from sessionStorage or default to null (All Clients)
                const saved = sessionStorage.getItem('workOrders_selectedClientId');
                setClientId(saved ? parseInt(saved) : null);
            } else {
                // Non-admin: Always use their client_id
                setClientId(user.client_id);
            }
        }
    }, [user]);

    // T041: Save clientId to sessionStorage when it changes (admin only)
    useEffect(() => {
        if (user?.role === 'admin') {
            if (clientId === null) {
                sessionStorage.removeItem('workOrders_selectedClientId');
            } else {
                sessionStorage.setItem('workOrders_selectedClientId', clientId.toString());
            }
        }
    }, [clientId, user]);

    useEffect(() => {
        // Only fetch if user is loaded and clientId is properly initialized
        // For non-admin users, wait until clientId is set
        if (!user) return;
        if (user.role !== 'admin' && clientId === null) return;

        fetchWorkOrders();
    }, [filters, clientId, user]);

    const fetchWorkOrders = async () => {
        try {
            setIsLoading(true);
            // Only pass clientId for staff and admin users (for X-Client-Context header)
            // Client and client_admin users get their client from JWT token automatically
            const contextClientId = ['staff', 'admin'].includes(user?.role) ? clientId : null;
            const response = await workOrderService.getWorkOrders(filters, contextClientId);
            console.log('Fetched work orders response:', response);
            console.log('Individual work order sample:', response.data[0]);
            setWorkOrders(response.data);
            // Handle pagination data from backend response structure
            if (response.pagination) {
                setTotalPages(response.pagination.pages || 1);
                setTotalCount(response.pagination.total || 0);
            } else {
                setTotalPages(1);
                setTotalCount(response.data.length);
            }
            setError(null);
        } catch (error) {
            setError('Failed to load work orders. Please try again.');
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (status) => {
        // If status is 'urgent', set it as a status filter for the backend
        setFilters(prev => ({ ...prev, status, page: 1 }));
    };

    const handleSearch = (searchTerm) => {
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    };

    const handleAuthorizedPersonChange = (authorizedPerson) => {
        setFilters(prev => ({ ...prev, authorized_person: authorizedPerson, page: 1 }));
    };

    const handleClientChange = (newClientId) => {
        setClientId(newClientId);
        // Reset authorized person filter and page when client changes
        setFilters(prev => ({ ...prev, authorized_person: '', page: 1 }));
    };

    const handleWorkOrderClick = (id) => {
        // Pass clientId in state so detail page can use it for API calls
        navigate(`/work-orders/${id}`, { state: { clientId } });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <AppHeader
                title="Work Orders"
                showBackButton={true}
                onBackClick={() => navigate('/dashboard')}
            />

            <div className="pt-16 p-4">
                <div className="mt-4">
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder="Search work orders..."
                    />
                </div>

                <ClientFilter
                    selectedClientId={clientId}
                    onClientChange={handleClientChange}
                    userRole={user?.role}
                />

                <FilterBar
                    activeFilter={filters.status}
                    onFilterChange={handleFilterChange}
                />

                <AuthorizedPersonFilter
                    activeFilter={filters.authorized_person}
                    onFilterChange={handleAuthorizedPersonChange}
                    clientId={clientId}
                />

                {isLoading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <p className="text-red-700">{error}</p>
                        <button
                            onClick={fetchWorkOrders}
                            className="mt-2 text-red-700 underline"
                        >
                            Try Again
                        </button>
                    </div>
                ) : workOrders.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mt-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No work orders found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filters.status || filters.search || filters.authorized_person || clientId
                                ? "Try adjusting your filters to see more results"
                                : "No work orders available at this time"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 mt-4">
                        {workOrders.map(workOrder => (
                            <WorkOrderCard
                                key={workOrder.id}
                                workOrder={workOrder}
                                onClick={() => handleWorkOrderClick(workOrder.id)}
                            />
                        ))}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="bg-white p-4 rounded-lg shadow mt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm text-gray-700">
                                        Page {filters.page} of {totalPages}
                                        {totalCount > 0 && ` • ${totalCount} total`}
                                    </div>
                                </div>

                                <div className="flex items-center justify-center space-x-1">
                                    {/* Previous Arrow */}
                                    <button
                                        onClick={() => handlePageChange(filters.page - 1)}
                                        disabled={filters.page === 1}
                                        className={`p-2 rounded-md ${filters.page === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-nextgen-green text-pure-white hover:bg-nextgen-green-dark'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center space-x-1 overflow-x-auto max-w-48">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                                            // Show first, last, current, and adjacent pages
                                            const showPage = pageNum === 1 ||
                                                pageNum === totalPages ||
                                                Math.abs(pageNum - filters.page) <= 1;

                                            if (!showPage && pageNum !== 2 && pageNum !== totalPages - 1) {
                                                // Show ellipsis for gaps
                                                if (pageNum === Math.min(filters.page - 2, totalPages - 2) && filters.page > 4) {
                                                    return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                                                }
                                                if (pageNum === Math.max(filters.page + 2, 3) && filters.page < totalPages - 3) {
                                                    return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                                                }
                                                return null;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-3 py-1 rounded-md text-sm font-medium min-w-8 ${pageNum === filters.page
                                                        ? 'bg-nextgen-green text-pure-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Next Arrow */}
                                    <button
                                        onClick={() => handlePageChange(filters.page + 1)}
                                        disabled={filters.page === totalPages}
                                        className={`p-2 rounded-md ${filters.page === totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-nextgen-green text-pure-white hover:bg-nextgen-green-dark'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <MobileNavigation />

            {/* Floating Action Button (FAB) - Only for client_admin users */}
            {/* Use Portal to render to dedicated fab-portal container */}
            {isClientAdmin && !isLoading && createPortal(
                <button
                    onClick={() => navigate('/work-orders/create')}
                    style={{
                        position: 'absolute',
                        bottom: '80px',
                        right: '24px',
                        width: '56px',
                        height: '56px',
                        backgroundColor: '#99ca3f',
                        color: 'white',
                        borderRadius: '50%',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7fb834'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#99ca3f'}
                    aria-label="Create new work order"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>,
                document.getElementById('fab-portal')
            )}
        </div>
    );
};

export default WorkOrdersPage;