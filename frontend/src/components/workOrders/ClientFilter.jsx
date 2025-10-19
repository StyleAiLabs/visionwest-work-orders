import React, { useState, useEffect } from 'react';
import clientService from '../../services/clientService';

/**
 * ClientFilter Component
 * Dropdown filter for admins to select and filter work orders by client
 * Only visible for users with admin role
 */
const ClientFilter = ({ selectedClientId, onClientChange, userRole }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Only show filter for admin users
  if (userRole !== 'admin') {
    return null;
  }

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const clientList = await clientService.getClients();
        setClients(clientList);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    // Convert "all" to null, otherwise parse as integer
    const clientId = value === 'all' ? null : parseInt(value);
    onClientChange(clientId);
  };

  if (loading) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client
        </label>
        <div className="text-gray-500 text-sm">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client
        </label>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label
        htmlFor="client-filter"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Client
      </label>
      <select
        id="client-filter"
        value={selectedClientId === null ? 'all' : selectedClientId}
        onChange={handleChange}
        className="block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
        style={{ minHeight: '44px' }} // Mobile touch target
      >
        <option value="all">All Clients</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            {client.name} ({client.code})
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClientFilter;
