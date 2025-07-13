import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import WorkOrderCard from '../components/workOrders/WorkOrderCard';
import FilterBar from '../components/workOrders/FilterBar';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { workOrderService } from '../services/workOrderService';

const WorkOrdersPage = () => {
    const navigate = useNavigate();
    const [workOrders, setWorkOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        page: 1,
        limit: 5
    });
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchWorkOrders();
    }, [filters]);

    const fetchWorkOrders = async () => {
        try {
            setIsLoading(true);
            const response = await workOrderService.getWorkOrders(filters);
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
        setFilters(prev => ({ ...prev, status, page: 1 }));
    };

    const handleSearch = (searchTerm) => {
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    };

    const handleWorkOrderClick = (id) => {
        navigate(`/work-orders/${id}`);
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

                <FilterBar
                    activeFilter={filters.status}
                    onFilterChange={handleFilterChange}
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
                                            : 'bg-vw-green text-white hover:bg-vw-green-dark'
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
                                                        ? 'bg-vw-green text-white'
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
                                            : 'bg-vw-green text-white hover:bg-vw-green-dark'
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
        </div>
    );
};

export default WorkOrdersPage;