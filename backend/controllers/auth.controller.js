const db = require('../models');
const User = db.user;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate request
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password!'
            });
        }

        // Find user by email with client association
        const user = await User.findOne({
            where: { email },
            include: [{
                model: db.client,
                as: 'client',
                attributes: ['id', 'name', 'code', 'status']
            }]
        });

        // Check if user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found!'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive. Please contact an administrator.'
            });
        }

        // Check if user has a client association
        if (!user.client_id || !user.client) {
            return res.status(500).json({
                success: false,
                message: 'User has no associated client organization. Please contact support.'
            });
        }

        // Check if client organization is active
        if (user.client.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your organization account is inactive. Please contact support.'
            });
        }

        // Check password
        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password!'
            });
        }

        // Generate JWT token with client_id for multi-tenant support
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                clientId: user.client_id,
                clientCode: user.client.code
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Check if user needs to change password
        const requirePasswordChange = !user.password_changed;

        // Remove password from response and include client info
        const userWithoutPassword = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            phone_number: user.phone_number,
            client_id: user.client_id,
            client: {
                id: user.client.id,
                name: user.client.name,
                code: user.client.code
            }
        };

        // Send response with password change requirement flag
        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: userWithoutPassword,
            token,
            requirePasswordChange  // Frontend will redirect to change password if true
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during the login process.'
        });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        // User is already available from the auth middleware
        const userId = req.userId;

        // Find the user with client association
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            include: [{
                model: db.client,
                as: 'client',
                attributes: ['id', 'name', 'code', 'status']
            }]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found!'
            });
        }

        // Format response to match login response structure
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            phone_number: user.phone_number,
            client_id: user.client_id,
            client: user.client ? {
                id: user.client.id,
                name: user.client.name,
                code: user.client.code
            } : null
        };

        return res.status(200).json({
            success: true,
            user: userResponse
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving user data.'
        });
    }
};

// Register new user
exports.register = async (req, res) => {
    try {
        const { email, password, name, role, client_id, phone_number, username } = req.body;

        // Validate required fields
        if (!email || !password || !name || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, password, name, and role!'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format!'
            });
        }

        // Validate role
        const validRoles = ['admin', 'client_admin', 'staff', 'client'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be one of: admin, client_admin, staff, client'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists!'
            });
        }

        // Determine client_id based on authorization
        let assignedClientId = client_id;

        // If requester is authenticated (registration by admin or client_admin)
        if (req.userId && req.userRole) {
            // Admin can register users for any client
            if (req.userRole === 'admin') {
                if (!client_id) {
                    return res.status(400).json({
                        success: false,
                        message: 'client_id is required when admin registers a user'
                    });
                }
                assignedClientId = client_id;
            }
            // Client admin can only register users for their own client
            else if (req.userRole === 'client_admin') {
                assignedClientId = req.clientId; // Force their own client
            }
            // Regular users cannot register new users
            else {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to register new users'
                });
            }
        }
        // Public registration (if enabled) - defaults to Visionwest client
        else {
            // For MVP, we require client_id in public registration
            if (!client_id) {
                return res.status(400).json({
                    success: false,
                    message: 'client_id is required for registration'
                });
            }
            assignedClientId = client_id;
        }

        // Validate client_id exists and is active
        const client = await db.client.findByPk(assignedClientId);
        if (!client) {
            return res.status(400).json({
                success: false,
                message: 'Invalid client_id. Client does not exist.'
            });
        }

        if (client.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot register user for inactive client organization'
            });
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Create user
        const user = await User.create({
            username: username || email.split('@')[0], // Default username from email
            email,
            password: hashedPassword,
            full_name: name,
            role,
            client_id: assignedClientId,
            phone_number: phone_number || null,
            is_active: true
        });

        // Load client association for response
        await user.reload({
            include: [{
                model: db.client,
                as: 'client',
                attributes: ['id', 'name', 'code', 'status']
            }]
        });

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                clientId: user.client_id,
                clientCode: user.client.code
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Remove password from response
        const userWithoutPassword = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            phone_number: user.phone_number,
            client_id: user.client_id,
            client: {
                id: user.client.id,
                name: user.client.name,
                code: user.client.code
            }
        };

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during registration.',
            error: error.message
        });
    }
};

// Logout - client-side operation, but we'll provide an endpoint for future needs
exports.logout = (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Logout successful!'
    });
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId; // From auth middleware

        // Validate request
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both current password and new password!'
            });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long!'
            });
        }

        // Find user
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found!'
            });
        }

        // Verify current password
        const passwordIsValid = bcrypt.compareSync(currentPassword, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect!'
            });
        }

        // Check if new password is same as current
        const sameAsOld = bcrypt.compareSync(newPassword, user.password);
        if (sameAsOld) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password!'
            });
        }

        // Hash new password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // Update password and set password_changed to true
        await user.update({
            password: hashedPassword,
            password_changed: true
        });

        console.log(`✅ User ${user.email} (ID: ${user.id}) successfully changed their password`);

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully!'
        });
    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while changing password.'
        });
    }
};