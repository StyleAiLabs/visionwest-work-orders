import React, { useState, useEffect } from 'react';
import { workOrderService } from '../../services/workOrderService';

const AuthorizedPersonFilter = ({ activeFilter, onFilterChange }) => {
    const [authorizedPersons, setAuthorizedPersons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAuthorizedPersons();
    }, []);

    const fetchAuthorizedPersons = async () => {
        try {
            setIsLoading(true);
            const response = await workOrderService.getAuthorizedPersons();
            setAuthorizedPersons(response.data || []);
        } catch (error) {
            console.error('Error fetching authorized persons:', error);
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
