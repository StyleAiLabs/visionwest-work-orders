import React, { useState, useEffect } from 'react';
import { workOrderService } from '../../services/workOrderService';
import { useAuth } from '../../hooks/useAuth';

const AuthorizedPersonFilter = ({ activeFilter, onFilterChange, clientId }) => {
    const { user } = useAuth();
    const [authorizedPersons, setAuthorizedPersons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAuthorizedPersons();
    }, [clientId]); // Re-fetch when clientId changes

    const fetchAuthorizedPersons = async () => {
        try {
            setIsLoading(true);
            setError(null);
            // Pass clientId for staff and admin users (for X-Client-Context header)
            // Client and client_admin users get their client from JWT token automatically
            const contextClientId = ['staff', 'admin'].includes(user?.role) ? clientId : null;
            const response = await workOrderService.getAuthorizedPersons(contextClientId);
            setAuthorizedPersons(response.data || []);

            // T031: Clear selected authorized person if not in new client's list
            if (activeFilter && activeFilter !== 'all') {
                const personExists = (response.data || []).includes(activeFilter);
                if (!personExists) {
                    onFilterChange('all'); // Clear filter if person doesn't exist in new client
                }
            }
        } catch (err) {
            console.error('Error fetching authorized persons:', err);
            setError('Failed to load authorized persons');
            setAuthorizedPersons([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authorized Person
                </label>
                <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authorized Person
                </label>
                <div className="text-red-500 text-sm">{error}</div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Authorized Person
            </label>
            <select
                value={activeFilter || 'all'}
                onChange={(e) => onFilterChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-vw-green focus:border-vw-green bg-white"
            >
                <option value="all">All Authorized Persons</option>
                {authorizedPersons.map((person) => (
                    <option key={person} value={person}>
                        {person}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default AuthorizedPersonFilter;
