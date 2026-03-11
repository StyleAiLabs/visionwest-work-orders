import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { listUsers, deleteUser, resetUserPassword } from '../services/userService';
import { getAllClients } from '../services/clientService';
import UserList from '../components/UserList';
import CreateUserForm from '../components/CreateUserForm';

const UserManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [temporaryPasswordNotice, setTemporaryPasswordNotice] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);

  // Redirect if not client_admin or admin (SuperAdmin)
  useEffect(() => {
    if (user && !['client_admin', 'admin'].includes(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch clients for admin users
  useEffect(() => {
    if (isAdmin) {
      fetchClients();
    }
  }, [isAdmin]);

  // Fetch users when selectedClientId changes
  useEffect(() => {
    if (isAdmin && selectedClientId) {
      fetchUsers();
    } else if (!isAdmin) {
      fetchUsers();
    }
  }, [selectedClientId, isAdmin]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await getAllClients({ status: 'active', limit: 100 });
      // API returns { success, data: [...], pagination }
      const clientList = response.data || [];
      setClients(clientList);
      // Auto-select "All Organizations" for admin
      setSelectedClientId('all');
    } catch (err) {
      console.error('Failed to load clients:', err);
      setError('Failed to load client organizations');
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      // For admin users, use X-Client-Context header only if specific client selected
      const headers = isAdmin && selectedClientId && selectedClientId !== 'all'
        ? { 'X-Client-Context': selectedClientId }
        : {};

      const data = await listUsers(1, 50, headers); // Get first 50 users
      setUsers(data.users);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setSuccessMessage('User created successfully! Credentials have been sent to their email.');
    fetchUsers(); // Refresh list

    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleEditUser = (user) => {
    // TODO: Implement edit modal (P2/P3)
    console.log('Edit user:', user);
    alert('Edit functionality coming in P2/P3');
  };

  const handleDeleteUser = async (userToDelete) => {
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete ${userToDelete.full_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      // For admin users, use X-Client-Context header if specific client is selected
      const headers = isAdmin && selectedClientId && selectedClientId !== 'all'
        ? { 'X-Client-Context': selectedClientId }
        : {};

      await deleteUser(userToDelete.id, headers);

      setSuccessMessage(`User ${userToDelete.full_name} has been deleted successfully.`);
      fetchUsers(); // Refresh list

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.error || 'Failed to delete user');

      // Clear error message after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleResetPassword = async (targetUser) => {
    const confirmed = window.confirm(
      `Reset password for ${targetUser.full_name}? They will receive a new temporary password by email.`
    );

    if (!confirmed) return;

    try {
      const headers = isAdmin && selectedClientId && selectedClientId !== 'all'
        ? { 'X-Client-Context': selectedClientId }
        : {};

      const response = await resetUserPassword(targetUser.id, headers);

      setSuccessMessage(`Password reset for ${targetUser.full_name}. Notification email sent.`);
      setTimeout(() => setSuccessMessage(''), 5000);

      if (response?.temporaryPassword) {
        setTemporaryPasswordNotice({
          fullName: targetUser.full_name,
          temporaryPassword: response.temporaryPassword
        });

        // Auto-hide sensitive password hint after a short interval.
        setTimeout(() => setTemporaryPasswordNotice(null), 30000);
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.response?.data?.error || 'Failed to reset password');
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Admin Panel
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            {isAdmin ? 'Manage users across all organizations' : 'Manage users in your organization'}
          </p>
        </div>

        {/* Client Selector (Admin Only) */}
        {isAdmin && (
          <div className="mb-6 bg-white border rounded-lg p-4 shadow-sm">
            <label htmlFor="client-selector" className="block text-sm font-medium text-gray-700 mb-2">
              Select Client Organization
            </label>
            {loadingClients ? (
              <div className="text-sm text-gray-500">Loading organizations...</div>
            ) : (
              <select
                id="client-selector"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Organizations</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.code})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Temporary password notice */}
        {temporaryPasswordNotice && (
          <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-lg">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Temporary password for {temporaryPasswordNotice.fullName}</p>
                <p className="font-mono text-sm">{temporaryPasswordNotice.temporaryPassword}</p>
                <p className="text-xs mt-1">Visible for 30 seconds. Share securely with the user.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(temporaryPasswordNotice.temporaryPassword)}
                  className="bg-amber-600 text-white py-1 px-3 rounded-md hover:bg-amber-700 text-sm"
                >
                  Copy
                </button>
                <button
                  onClick={() => setTemporaryPasswordNotice(null)}
                  className="bg-white border border-amber-400 text-amber-900 py-1 px-3 rounded-md hover:bg-amber-100 text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Create User Button */}
        {!showCreateForm && (
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Create New User
            </button>
          </div>
        )}

        {/* Create User Form (conditional) */}
        {showCreateForm && (
          <div className="mb-6 bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Create New User</h2>
            <CreateUserForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* User List */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <UserList
            users={users}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onResetPassword={handleResetPassword}
            currentUserId={user?.id}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
