import React, { useState, useEffect } from 'react';
import { createUser } from '../services/userService';
import { getAllClients } from '../services/clientService';
import { useAuth } from '../hooks/useAuth';

const CreateUserForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'client',
    phone_number: '',
    client_id: '' // For admin users to select client
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Fetch clients for admin users
  useEffect(() => {
    if (isAdmin) {
      fetchClients();
    }
  }, [isAdmin]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await getAllClients({ status: 'active', limit: 100 });
      // API returns { success, data: [...], pagination }
      setClients(response.data || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
      setError('Failed to load client organizations');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!formData.full_name.trim() || !formData.email.trim()) {
        setError('Full name and email are required');
        setIsSubmitting(false);
        return;
      }

      // Admin users must select a client
      if (isAdmin && !formData.client_id) {
        setError('Please select a client organization');
        setIsSubmitting(false);
        return;
      }

      // Submit form
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        phone_number: formData.phone_number.trim() || null
      };

      // For admin users, use X-Client-Context header to specify target client
      const headers = isAdmin && formData.client_id
        ? { 'X-Client-Context': formData.client_id }
        : {};

      await createUser(payload, headers);

      // Success - call parent callback
      onSuccess();

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Client Selector (Admin Only) */}
      {isAdmin && (
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
            Client Organization *
          </label>
          {loadingClients ? (
            <div className="text-sm text-gray-500">Loading client organizations...</div>
          ) : (
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select client organization</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.code})
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Select which organization this user belongs to
          </p>
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter full name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="user@example.com"
        />
      </div>

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          id="phone_number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="+64211234567"
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter in international format (e.g., +64211234567)
        </p>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="client">Client User</option>
          <option value="client_admin">Client Admin</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Client Admins can manage users. Client Users have standard access.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? 'Creating User...' : 'Create User'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CreateUserForm;
