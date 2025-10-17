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

        // Send response
        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: userWithoutPassword,
            token
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

        // Find the user
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found!'
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving user data.'
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