import React, { useState, useEffect } from 'react';
import { getAllClients } from '../../services/clientService';
import StatusBadge from '../common/StatusBadge';

/**
 * ClientList Component
 * Mobile-first card layout displaying all clients
 * Admin only - for client management
 */
const ClientList = ({ onClientSelect, onCreateNew }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    useEffect(() => {
        loadClients();
    }, [searchTerm, statusFilter, pagination.page]);

    const loadClients = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: pagination.page,
                limit: pagination.limit
            };

            if (searchTerm) params.search = searchTerm;
            if (statusFilter) params.status = statusFilter;

            const response = await getAllClients(params);

            setClients(response.data || []);
            setPagination(response.pagination || pagination);
        } catch (err) {
            console.error('Error loading clients:', err);
            setError(err.response?.data?.message || 'Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPagination({ ...pagination, page: 1 }); // Reset to first page on search
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPagination({ ...pagination, page: 1 }); // Reset to first page on filter
    };

    const handlePageChange = (newPage) => {
        setPagination({ ...pagination, page: newPage });
    };

    if (loading && clients.length === 0) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Create Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
                <button
                    onClick={onCreateNew}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Client
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Client Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client) => (
                    <div
                        key={client.id}
                        onClick={() => onClientSelect(client)}
                        className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {client.name}
                                </h3>
                                <p className="text-sm text-gray-500 font-mono">
                                    {client.code}
                                </p>
                            </div>
                            <StatusBadge status={client.status} />
                        </div>

                        {/* Contact Info */}
                        {client.primary_contact_name && (
                            <div className="mb-3 text-sm">
                                <p className="text-gray-700 font-medium">
                                    {client.primary_contact_name}
                                </p>
                                {client.primary_contact_email && (
                                    <p className="text-gray-600 truncate">
                                        {client.primary_contact_email}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Stats */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-sm text-gray-600">
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                {client.user_count || 0} users
                            </div>
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {client.work_order_count || 0} work orders
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {clients.length === 0 && !loading && (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="mt-4 text-gray-600">No clients found</p>
                    {(searchTerm || statusFilter) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('');
                            }}
                            className="mt-2 text-blue-600 hover:text-blue-700"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClientList;
