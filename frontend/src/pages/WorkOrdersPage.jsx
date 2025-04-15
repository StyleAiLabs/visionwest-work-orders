import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import MobileNavigation from '../components/layout/MobileNavigation';
import StatusBadge from '../components/workOrders/StatusBadge';
import api from '../services/api';

const WorkOrdersPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [workOrders, setWorkOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    // Parse query parameters
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const status = queryParams.get('status');
        const date = queryParams.get('date');
        const sort = queryParams.get('sort');

        if (status) {
            setActiveFilter(status);
        } else if (date === 'today') {
            setActiveFilter('today');
        } else if (sort === 'latest') {
            setActiveFilter('latest');
        }
    }, [location.search]);

    // Fetch work orders
    useEffect(() => {
        const fetchWorkOrders = async () => {
            try {
                setIsLoading(true);

                // In a real implementation, this would be an actual API call with filters
                // const params = {};
                // if (activeFilter !== 'all') {
                //   if (['pending', 'in-progress', 'completed'].includes(activeFilter)) {
                //     params.status = activeFilter;
                //   } else if (activeFilter === 'today') {
                //     params.date = 'today';
                //   } else if (activeFilter === 'latest') {
                //     params.sort = 'latest';
                //   }
                // }
                // const response = await api.get('/work-orders', { params });
                // setWorkOrders(response.data);

                // Mock data for development
                setTimeout(() => {
                    const mockData = [
                        {
                            id: '1',
                            jobNo: 'RBWO010965',
                            date: '04 Apr 2025',
                            status: 'pending',
                            property: 'VisionWest Community Trust',
                            description: 'Cleaning rubbish/debris off the roof to determine cause of leak. Tenants are aware of the visit.',
                            authorizedBy: 'Danell Anderson'
                        },
                        {
                            id: '2',
                            jobNo: 'RBWO010943',
                            date: '03 Apr 2025',
                            status: 'in-progress',
                            property: 'VisionWest Community Trust',
                            description: 'Fix broken window in living room. Temporary repairs done, waiting for replacement glass.',
                            authorizedBy: 'James Wilson'
                        },
                        {
                            id: '3',
                            jobNo: 'RBWO010932',
                            date: '02 Apr 2025',
                            status: 'completed',
                            property: 'VisionWest Community Trust',
                            description: 'Replace faulty smoke detector in hallway. New detector installed and tested.',
                            authorizedBy: 'Danell Anderson'
                        }
                    ];

                    // Apply filters for mock data
                    let filteredData = [...mockData];

                    if (activeFilter === 'pending') {
                        filteredData = filteredData.filter(order => order.status === 'pending');
                    } else if (activeFilter === 'in-progress') {
                        filteredData = filteredData.filter(order => order.status === 'in-progress');
                    } else if (activeFilter === 'completed') {
                        filteredData = filteredData.filter(order => order.status === 'completed');
                    }

                    setWorkOrders(filteredData);
                    setIsLoading(false);
                }, 1000);
            } catch (error) {
                console.error('Error fetching work orders:', error);
                setIsLoading(false);
            }
        };

        fetchWorkOrders();
    }, [activeFilter]);

    // Filter work orders based on search query
    const filteredWorkOrders = searchQuery
        ? workOrders.filter(order =>
            order.jobNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.property.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : workOrders;

    const handleFilterClick = (filter) => {
        setActiveFilter(filter);

        // Update URL query parameters
        const queryParams = new URLSearchParams();
        if (filter !== 'all') {
            if (['pending', 'in-progress', 'completed'].includes(filter)) {
                queryParams.set('status', filter);
            } else if (filter === 'today') {
                queryParams.set('date', 'today');
            } else if (filter === 'latest') {
                queryParams.set('sort', 'latest');
            }
        }

        navigate({
            pathname: '/work-orders',
            search: queryParams.toString()
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 pb-16">
            <AppHeader
                title="Work Orders"
                showBackButton={true}
                onBackClick={() => navigate('/dashboard')}
                rightContent={
                    <button className="p-1 rounded-full hover:bg-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </button>
                }
            />

            {/* Search & Filter */}
            <div className="bg-white p-3 shadow">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        name="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Search job number or property"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    <button
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activeFilter === 'all'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}
                        onClick={() => handleFilterClick('all')}
                    >
                        All
                    </button>
                    <button
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activeFilter === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}
                        onClick={() => handleFilterClick('pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activeFilter === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}
                        onClick={() => handleFilterClick('in-progress')}
                    >
                        In Progress
                    </button>
                    <button
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activeFilter === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}
                        onClick={() => handleFilterClick('completed')}
                    >
                        Completed
                    </button>
                </div>
            </div>

            {/* Work Order List */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-3">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredWorkOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 bg-white rounded-lg shadow p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-600">No work orders found</p>
                        {searchQuery && (
                            <button
                                className="mt-2 text-indigo-600 text-sm"
                                onClick={() => setSearchQuery('')}
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredWorkOrders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg shadow p-3 cursor-pointer"
                                onClick={() => navigate(`/work-orders/${order.id}`)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <StatusBadge status={order.status} />
                                        <h3 className="text-sm font-medium mt-1">Job #{order.jobNo}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{order.property}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">{order.date}</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{order.description}</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center text-xs text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {order.authorizedBy}
                                    </div>
                                    <button className="text-indigo-600 text-xs font-medium">
                                        View details →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <MobileNavigation />
        </div>
    );
};

export default WorkOrdersPage;