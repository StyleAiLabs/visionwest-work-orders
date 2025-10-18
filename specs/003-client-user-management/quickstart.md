# Quickstart Implementation Guide: Client User Management

**Feature**: 003-client-user-management
**Date**: 2025-10-19
**For**: Developers implementing this feature

## Overview

This guide provides step-by-step implementation instructions for the client user management feature. Follow the P1 MVP validation pattern: Backend → Frontend → Manual Testing → Integration Testing.

---

## Prerequisites

Before starting implementation, verify:

- [ ] Node.js 18.x installed
- [ ] PostgreSQL database running and accessible
- [ ] Backend and frontend development servers can run locally
- [ ] You have access to SMTP credentials for email testing (check .env file)
- [ ] You are on the `003-client-user-management` branch

**Setup Commands**:
```bash
# Verify you're on correct branch
git branch --show-current  # Should show: 003-client-user-management

# Install dependencies (if not already done)
cd backend && npm install
cd ../frontend && npm install

# Start backend (in one terminal)
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm run dev
```

---

## Implementation Phases

### Phase 1: Backend Implementation (P1 MVP - Create User)

#### Step 1.1: Create Database Migration

**File**: `/backend/migrations/YYYYMMDDHHMMSS-add-unique-email-client-index.js`

Generate migration:
```bash
cd backend
npx sequelize-cli migration:generate --name add-unique-email-client-index
```

Edit generated file:
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add compound unique index for email + client_id
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX user_email_client_idx
      ON users (LOWER(email), client_id)
      WHERE client_id IS NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', 'user_email_client_idx');
  }
};
```

Run migration:
```bash
npx sequelize-cli db:migrate
```

Verify migration:
```bash
# Connect to PostgreSQL
psql -d your_database_name

# Check index exists
\d users

# Should see: user_email_client_idx (UNIQUE btree)
```

---

#### Step 1.2: Create Password Generator Utility

**File**: `/backend/utils/passwordGenerator.js`

```javascript
const crypto = require('crypto');

/**
 * Generates a secure random password with mixed character types
 * @returns {string} 12-character password with uppercase, lowercase, numbers, and symbols
 */
function generateSecurePassword() {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';

  // Ensure at least one of each character type
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];
  password += symbols[crypto.randomInt(0, symbols.length)]; // 2 symbols minimum

  // Fill remaining characters randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the password to avoid predictable pattern
  return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
}

module.exports = { generateSecurePassword };
```

Test the utility:
```bash
node -e "console.log(require('./utils/passwordGenerator').generateSecurePassword())"
# Should output: Random 12-char password like "aB3!xY7@zK9$"
```

---

#### Step 1.3: Extend Email Service

**File**: `/backend/utils/emailService.js`

Add this function to existing emailService.js:

```javascript
/**
 * Sends welcome email to newly created user with temporary credentials
 * @param {Object} user - User object (must have email, full_name)
 * @param {string} temporaryPassword - Plain text temporary password
 * @returns {Promise<void>}
 */
async function sendNewUserCredentialsEmail(user, temporaryPassword) {
  // Non-blocking email - don't throw errors
  try {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to NextGen WOM - Your Account Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to NextGen WOM!</h2>

          <p>Hi ${user.full_name},</p>

          <p>A client admin has created an account for you in the NextGen Work Order Management system.</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Your Login Credentials:</strong></p>
            <p style="margin: 10px 0 0 0;">
              <strong>Email:</strong> ${user.email}<br>
              <strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</code>
            </p>
          </div>

          <p><strong>Important:</strong> Please change your password after your first login for security.</p>

          <p>
            <a href="${loginUrl}/login"
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Login to NextGen WOM
            </a>
          </p>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions or need assistance, please contact your organization's admin.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Credentials email sent to ${user.email}`);

  } catch (error) {
    // Log error but don't throw - email failure should not block user creation
    console.error(`❌ Failed to send credentials email to ${user.email}:`, error.message);
    // Note: Do NOT log the password
  }
}

module.exports = {
  sendWorkOrderCreatedEmail,
  sendNewUserCredentialsEmail, // Export new function
  verifyEmailConfig
};
```

Add FRONTEND_URL to .env:
```bash
# Add to backend/.env
FRONTEND_URL=http://localhost:5173
```

---

#### Step 1.4: Create User Controller

**File**: `/backend/controllers/user.controller.js`

```javascript
const { User, Client } = require('../models');
const bcrypt = require('bcrypt');
const { generateSecurePassword } = require('../utils/passwordGenerator');
const { sendNewUserCredentialsEmail } = require('../utils/emailService');
const { Op } = require('sequelize');

/**
 * List all users in the admin's client organization
 * GET /api/users?page=1&limit=50
 */
async function listUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where: {
        client_id: req.clientId,
        is_active: true
      },
      attributes: ['id', 'full_name', 'email', 'role', 'phone_number', 'createdAt'],
      order: [['full_name', 'ASC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      users,
      total: count,
      page,
      totalPages
    });

  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
}

/**
 * Get details for a specific user
 * GET /api/users/:userId
 */
async function getUserById(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findOne({
      where: {
        id: userId,
        client_id: req.clientId // Enforce multi-tenant isolation
      },
      attributes: ['id', 'full_name', 'email', 'role', 'phone_number', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
}

/**
 * Create a new user in the admin's client organization
 * POST /api/users
 */
async function createUser(req, res) {
  try {
    const { full_name, email, role, phone_number } = req.body;

    // Validation
    if (!full_name || !email || !role) {
      return res.status(400).json({ error: 'Full name, email, and role are required' });
    }

    // Role constraint: Only 'client' and 'client_admin' allowed
    if (!['client', 'client_admin'].includes(role)) {
      return res.status(400).json({ error: 'You can only assign Client User or Client Admin roles' });
    }

    // Email format validation (basic check, Sequelize will do deeper validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Check for duplicate email within organization
    const existingUser = await User.findOne({
      where: {
        email: { [Op.iLike]: email }, // Case-insensitive check
        client_id: req.clientId
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists in your organization' });
    }

    // Phone validation (if provided) - basic E.164 format check
    if (phone_number && !/^\+[1-9]\d{1,14}$/.test(phone_number)) {
      return res.status(400).json({ error: 'Please provide a valid phone number in international format (e.g., +64211234567)' });
    }

    // Get client name for organization field
    const client = await Client.findByPk(req.clientId);
    if (!client) {
      return res.status(400).json({ error: 'Client organization not found' });
    }

    // Generate secure temporary password
    const temporaryPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create user
    const newUser = await User.create({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      username: email.toLowerCase().trim(), // Backward compatibility
      password: hashedPassword,
      role,
      phone_number: phone_number || null,
      client_id: req.clientId,
      organization: client.name,
      is_active: true
    });

    // Send credentials email (async, non-blocking)
    sendNewUserCredentialsEmail(newUser, temporaryPassword);

    // Return user without password
    const userResponse = {
      id: newUser.id,
      full_name: newUser.full_name,
      email: newUser.email,
      role: newUser.role,
      phone_number: newUser.phone_number,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      message: 'User created successfully. Credentials have been sent to their email.',
      user: userResponse
    });

  } catch (error) {
    console.error('Error creating user:', error);

    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A user with this email already exists in your organization' });
    }

    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * Update user role or contact details
 * PATCH /api/users/:userId
 */
async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { full_name, email, role, phone_number } = req.body;

    // At least one field must be provided
    if (!full_name && !email && !role && phone_number === undefined) {
      return res.status(400).json({ error: 'At least one field must be provided for update' });
    }

    // Find user (enforce multi-tenant isolation)
    const user = await User.findOne({
      where: {
        id: userId,
        client_id: req.clientId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-role-change
    if (role && userId == req.userId) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    // Role constraint validation
    if (role && !['client', 'client_admin'].includes(role)) {
      return res.status(400).json({ error: 'You can only assign Client User or Client Admin roles' });
    }

    // Email uniqueness check (if changing email)
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({
        where: {
          email: { [Op.iLike]: email },
          client_id: req.clientId,
          id: { [Op.ne]: userId } // Exclude current user
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists in your organization' });
      }
    }

    // Phone validation (if provided)
    if (phone_number && phone_number !== null && !/^\+[1-9]\d{1,14}$/.test(phone_number)) {
      return res.status(400).json({ error: 'Please provide a valid phone number in international format (e.g., +64211234567)' });
    }

    // Build update object
    const updates = {};
    if (full_name) updates.full_name = full_name.trim();
    if (email) {
      updates.email = email.toLowerCase().trim();
      updates.username = email.toLowerCase().trim(); // Keep username in sync
    }
    if (role) updates.role = role;
    if (phone_number !== undefined) updates.phone_number = phone_number || null;

    // Update user
    await user.update(updates);

    // Return updated user
    const userResponse = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone_number: user.phone_number,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      message: 'User updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Error updating user:', error);

    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A user with this email already exists in your organization' });
    }

    res.status(500).json({ error: 'Failed to update user' });
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser
};
```

---

#### Step 1.5: Create User Routes

**File**: `/backend/routes/user.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { verifyToken, isClientAdmin } = require('../middleware/auth.middleware');
const { addClientScope } = require('../middleware/clientScoping');
const {
  listUsers,
  getUserById,
  createUser,
  updateUser
} = require('../controllers/user.controller');

// All routes require authentication and client_admin role
router.use(verifyToken);
router.use(isClientAdmin);
router.use(addClientScope);

// User management endpoints
router.get('/', listUsers);           // GET /api/users
router.post('/', createUser);         // POST /api/users
router.get('/:userId', getUserById);  // GET /api/users/:userId
router.patch('/:userId', updateUser); // PATCH /api/users/:userId

module.exports = router;
```

---

#### Step 1.6: Register Routes in Server

**File**: `/backend/server.js`

Add this line with other route registrations:

```javascript
// Existing routes...
const authRoutes = require('./routes/auth.routes');
const workOrderRoutes = require('./routes/workOrder.routes');
// ... other routes ...

// ADD THIS:
const userRoutes = require('./routes/user.routes');

// Route registrations...
app.use('/api/auth', authRoutes);
app.use('/api/work-orders', workOrderRoutes);
// ... other routes ...

// ADD THIS:
app.use('/api/users', userRoutes);
```

---

#### Step 1.7: Test Backend Endpoints

Use Postman, curl, or similar tool to test:

**1. Login as client_admin**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your_password"}'

# Save the returned token
TOKEN="your_jwt_token_here"
```

**2. Create a user**:
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "Test User",
    "email": "testuser@example.com",
    "role": "client",
    "phone_number": "+64211234567"
  }'

# Expected: 201 Created with user object
```

**3. List users**:
```bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with paginated user list
```

**4. Update user role**:
```bash
curl -X PATCH http://localhost:5000/api/users/3 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"role": "client_admin"}'

# Expected: 200 OK with updated user
```

**5. Test validation errors**:
```bash
# Duplicate email
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "Another User",
    "email": "testuser@example.com",
    "role": "client"
  }'
# Expected: 400 Bad Request - "A user with this email already exists..."

# Invalid role
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "Admin User",
    "email": "admin2@example.com",
    "role": "admin"
  }'
# Expected: 400 Bad Request - "You can only assign Client User or Client Admin roles"
```

---

### Phase 2: Frontend Implementation (P1 MVP - Create User UI)

#### Step 2.1: Create User API Service

**File**: `/frontend/src/services/userService.js`

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * List users in client organization (paginated)
 */
export const listUsers = async (page = 1, limit = 50) => {
  const response = await axios.get(`${API_URL}/users`, {
    params: { page, limit },
    headers: getAuthHeader()
  });
  return response.data;
};

/**
 * Get user details by ID
 */
export const getUserById = async (userId) => {
  const response = await axios.get(`${API_URL}/users/${userId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

/**
 * Create a new user
 */
export const createUser = async (userData) => {
  const response = await axios.post(`${API_URL}/users`, userData, {
    headers: getAuthHeader()
  });
  return response.data;
};

/**
 * Update user (role or contact details)
 */
export const updateUser = async (userId, updates) => {
  const response = await axios.patch(`${API_URL}/users/${userId}`, updates, {
    headers: getAuthHeader()
  });
  return response.data;
};

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser
};
```

---

#### Step 2.2: Create User List Component

**File**: `/frontend/src/components/UserList.jsx`

```javascript
import React from 'react';

const UserList = ({ users, onEditUser, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No users found in your organization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-0">
      {/* Mobile: Card layout */}
      <div className="block md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">{user.full_name}</h3>
                <p className="text-gray-600 text-sm">{user.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.role === 'client_admin'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.role === 'client_admin' ? 'Admin' : 'User'}
              </span>
            </div>
            {user.phone_number && (
              <p className="text-gray-600 text-sm mb-3">{user.phone_number}</p>
            )}
            <button
              onClick={() => onEditUser(user)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Edit User
            </button>
          </div>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{user.full_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-600">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-600">{user.phone_number || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'client_admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'client_admin' ? 'Client Admin' : 'Client User'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onEditUser(user)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
```

---

#### Step 2.3: Create User Form Component

**File**: `/frontend/src/components/CreateUserForm.jsx`

```javascript
import React, { useState } from 'react';
import { createUser } from '../services/userService';

const CreateUserForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'client',
    phone_number: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Submit form
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        phone_number: formData.phone_number.trim() || null
      };

      await createUser(payload);

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
```

---

#### Step 2.4: Create User Management Page

**File**: `/frontend/src/pages/UserManagementPage.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { listUsers } from '../services/userService';
import UserList from '../components/UserList';
import CreateUserForm from '../components/CreateUserForm';

const UserManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if not client_admin
  useEffect(() => {
    if (user && user.role !== 'client_admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await listUsers(1, 50); // Get first 50 users
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

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage users in your organization
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
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
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
```

---

#### Step 2.5: Add Route to App

**File**: `/frontend/src/App.jsx`

Add the new route:

```javascript
import UserManagementPage from './pages/UserManagementPage';

// ... existing code ...

// Inside your Routes component, add:
<Route
  path="/users"
  element={
    <ProtectedRoute>
      <UserManagementPage />
    </ProtectedRoute>
  }
/>
```

---

#### Step 2.6: Add Navigation Menu Item

Find your navigation component (e.g., Sidebar or NavMenu) and add:

```javascript
// For client_admin users only
{user?.role === 'client_admin' && (
  <NavLink to="/users" className="nav-link">
    <UsersIcon className="icon" />
    <span>User Management</span>
  </NavLink>
)}
```

---

### Phase 3: Manual Testing

#### Test Plan

**Test on actual mobile devices** (required by constitution):

1. **iOS Safari** (iPhone):
   - [ ] Login as client_admin
   - [ ] Navigate to User Management page
   - [ ] Click "Create New User" button (touch target size OK?)
   - [ ] Fill form on mobile (fields large enough?)
   - [ ] Submit form (loading state visible?)
   - [ ] View user list in card layout
   - [ ] Test edit button on user card

2. **Android Chrome**:
   - [ ] Same tests as iOS

3. **Desktop Chrome** (1920x1080):
   - [ ] User list displays as table
   - [ ] Create form works in modal/section
   - [ ] All interactions smooth

#### Test Cases

**TC-001: Create User - Happy Path**
- Login as client_admin
- Click "Create New User"
- Fill: Name="Test User", Email="test@example.com", Role="Client User", Phone="+64211234567"
- Submit
- Expected: Success message, user appears in list, email sent

**TC-002: Create User - Duplicate Email**
- Try to create user with existing email
- Expected: Error message "A user with this email already exists..."

**TC-003: Create User - Invalid Phone**
- Enter phone without + prefix (e.g., "0211234567")
- Submit
- Expected: Error message about international format

**TC-004: Create User - Invalid Role**
- Try to assign "admin" role via API (not possible in UI)
- Expected: 400 error from backend

**TC-005: Role-Based Access Control**
- Login as 'client' role user
- Try to access /users
- Expected: Redirect to dashboard

**TC-006: Multi-Tenant Isolation**
- Login as client_admin for Organization A
- Create users
- Login as client_admin for Organization B
- View users
- Expected: Only see Organization B's users

---

### Phase 4: Integration Testing

#### Test n8n Webhook (No Impact Expected)

1. Trigger n8n workflow (email → PDF extraction → webhook)
2. Verify work order created successfully
3. Verify no errors in logs
4. Expected: User management feature does NOT affect webhook

#### Test Existing Features

- [ ] Login/logout still works
- [ ] Work order list/view still works
- [ ] Settings page accessible
- [ ] No console errors on any page

---

## Environment Variables

Ensure these are set in `/backend/.env`:

```bash
# Email Configuration (existing)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_smtp_password

# Frontend URL (new)
FRONTEND_URL=http://localhost:5173  # Dev
# FRONTEND_URL=https://app.example.com  # Production
```

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution**:
```bash
# Check if index already exists
psql -d your_db -c "\d users"

# If exists, manually drop it:
psql -d your_db -c "DROP INDEX IF EXISTS user_email_client_idx;"

# Re-run migration:
npx sequelize-cli db:migrate
```

### Issue: Email not sending

**Solution**:
1. Check EMAIL_* variables in .env
2. Test SMTP connection:
   ```bash
   node -e "require('./utils/emailService').verifyEmailConfig()"
   ```
3. Check console logs for email errors (non-blocking, won't prevent user creation)

### Issue: "403 Forbidden" when accessing /users

**Solution**:
- Verify you're logged in as client_admin role
- Check JWT token is valid and not expired
- Verify isClientAdmin middleware is applied to routes

### Issue: Users from different orgs visible

**Solution**:
- Check client_id is being set correctly from JWT
- Verify clientScoping middleware is applied
- Check User queries include `WHERE client_id = req.clientId`

---

## Next Steps (P2/P3)

After P1 MVP is complete and tested:

**P2: Update User Role**
- Add EditUserModal component with role selection
- Implement updateUser API call for role changes
- Test permission updates are immediate

**P3: Update Contact Details**
- Extend EditUserModal with contact fields
- Allow email/phone updates with validation
- Test duplicate email checks work for updates

---

## Deployment Checklist

Before merging to main:

- [ ] All manual tests passed on mobile devices
- [ ] Integration tests show no regression
- [ ] Migration tested on staging database
- [ ] Environment variables documented
- [ ] Version bumped to 2.7.0 in package.json (both frontend and backend)
- [ ] Settings page version updated
- [ ] Release notes added for 2.7.0
- [ ] n8n webhook integration verified
- [ ] Email delivery tested in staging

---

## Success Criteria Validation

Verify these from spec.md:

- [ ] SC-001: User creation takes <1 minute
- [ ] SC-002: Updates take <30 seconds
- [ ] SC-003: 100% admin-only access enforced
- [ ] SC-004: Zero data loss incidents
- [ ] SC-005: Credentials received within 5 minutes
- [ ] SC-006: Handles 500 users without performance issues

---

## Reference Files

- Spec: `/specs/003-client-user-management/spec.md`
- Plan: `/specs/003-client-user-management/plan.md`
- Research: `/specs/003-client-user-management/research.md`
- Data Model: `/specs/003-client-user-management/data-model.md`
- API Contract: `/specs/003-client-user-management/contracts/user-api.yaml`
- This Guide: `/specs/003-client-user-management/quickstart.md`

---

**Implementation Time Estimate**: 6-8 hours for P1 MVP (backend + frontend + testing)

**Ready to code!** Follow steps sequentially for best results.
