const db = require('../models');
const bcrypt = require('bcryptjs');
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

    // Build where clause - admins without X-Client-Context can see all users
    const whereClause = {
      is_active: true
    };

    // If not admin OR if admin with context-switched client, filter by client_id
    if (!req.isGlobalAdmin || req.isAdminSwitchedContext) {
      whereClause.client_id = req.clientId;
    }

    const { count, rows: users } = await db.user.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'full_name', 'email', 'role', 'phone_number', 'createdAt', 'organization'],
      include: [
        {
          model: db.client,
          as: 'client',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['full_name', 'ASC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    // Serialize the users to plain objects to ensure nested data is included
    const serializedUsers = users.map(user => user.toJSON());

    res.json({
      users: serializedUsers,
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

    const user = await db.user.findOne({
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
    const existingUser = await db.user.findOne({
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
    const client = await db.client.findByPk(req.clientId);
    if (!client) {
      return res.status(400).json({ error: 'Client organization not found' });
    }

    // Generate secure temporary password
    const temporaryPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create user
    const newUser = await db.user.create({
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
    const user = await db.user.findOne({
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
      const existingUser = await db.user.findOne({
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

/**
 * Delete user (soft delete by setting is_active to false)
 * DELETE /api/users/:userId
 */
async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    // Find user (enforce multi-tenant isolation)
    const user = await db.user.findOne({
      where: {
        id: userId,
        client_id: req.clientId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-deletion
    if (userId == req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Soft delete by setting is_active to false
    await user.update({ is_active: false });

    res.json({
      message: 'User deleted successfully',
      userId: user.id
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
