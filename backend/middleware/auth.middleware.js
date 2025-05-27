const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.user;

// Verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided!'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if user exists
            const user = await User.findByPk(decoded.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User associated with this token no longer exists!'
                });
            }

            // Check if user is active
            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account is inactive. Please contact an administrator.'
                });
            }

            // Add user id to request
            req.userId = decoded.id;
            req.userRole = decoded.role;

            next();
        } catch (error) {
            console.error('Token verification error:', error);

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired!'
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Unauthorized!'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during authentication.'
        });
    }
};

// Check if user has staff role or higher (admin)
const isStaff = (req, res, next) => {
    if (req.userRole !== 'staff' && req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Require Williams Property Staff or Admin Role!'
        });
    }
    next();
};

// Check if user has admin role
const isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Require Admin Role!'
        });
    }
    next();
};

// Check if user is a client (VisionWest)
exports.isClient = (req, res, next) => {
    if (req.userRole !== 'client') {
        return res.status(403).json({
            success: false,
            message: 'Require VisionWest Client Role!'
        });
    }
    next();
};

// Check if user has any valid role (client, staff, or admin)
exports.isAnyValidRole = (req, res, next) => {
    const validRoles = ['client', 'client_admin', 'staff', 'admin'];

    if (!validRoles.includes(req.userRole)) {
        return res.status(403).json({
            success: false,
            message: 'Invalid user role!'
        });
    }

    next();
};

// Add new middleware for VisionWest admin only
exports.isVisionWestAdmin = (req, res, next) => {
    if (req.userRole !== 'client_admin') {
        return res.status(403).json({
            success: false,
            message: 'Require VisionWest Admin Role!'
        });
    }
    next();
};

// Add middleware for any VisionWest user
exports.isVisionWestUser = (req, res, next) => {
    if (!['client', 'client_admin'].includes(req.userRole)) {
        return res.status(403).json({
            success: false,
            message: 'Require VisionWest User Access!'
        });
    }
    next();
};

// Add this to auth.middleware.js
exports.isClientAdmin = (req, res, next) => {
    if (req.userRole !== 'client_admin') {
        return res.status(403).json({
            success: false,
            message: 'Require VisionWest Admin Role!'
        });
    }
    next();
};

// Add this new specialized middleware

exports.handleWorkOrderStatusUpdate = (req, res, next) => {
    console.log('STATUS UPDATE DEBUG - Request details:');
    console.log('- User role:', req.userRole);
    console.log('- Status update:', req.body?.status);

    // For client users, only allow cancellation
    if (req.userRole === 'client') {
        if (req.body && req.body.status === 'cancelled') {
            return next(); // Allow client cancellation
        } else {
            return res.status(403).json({
                success: false,
                message: 'Clients can only request cancellation of work orders.'
            });
        }
    }

    // For staff/admin, allow any status update
    if (['admin', 'staff'].includes(req.userRole)) {
        return next();
    }

    // Default deny
    return res.status(403).json({
        success: false,
        message: 'Unauthorized to update work order status.'
    });
};

// Make sure exports are correct
module.exports = {
    verifyToken,
    isStaff,
    isAdmin
};