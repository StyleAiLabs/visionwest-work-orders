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
        limit: 10
    });

    useEffect(() => {
        fetchWorkOrders();
    }, [filters]);

    const fetchWorkOrders = async () => {
        try {
            setIsLoading(true);
            const response = await workOrderService.getWorkOrders(filters);
            //console.log('Fetched work orders:', response.data);
            setWorkOrders(response.data);
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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 pt-16">
            <AppHeader
                title="Work Orders"
                showBackButton={false}
            />

            <div className="flex-1 p-4">
                <SearchBar
                    onSearch={handleSearch}
                    placeholder="Search work orders..."
                />

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
                    </div>
                )}
            </div>

            <MobileNavigation />
        </div>
    );
};

export default WorkOrdersPage;