const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.user;

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
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

// Check if user has admin role
exports.isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Require Admin Role!'
        });
    }
    next();
};

// Check if user has staff role or higher (admin)
exports.isStaffOrAdmin = (req, res, next) => {
    if (req.userRole !== 'staff' && req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Require Williams Property Staff or Admin Role!'
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
    if (!req.userRole) {
        return res.status(403).json({
            success: false,
            message: "No role assigned!"
        });
    }

    // Get the request method and route
    const { method, originalUrl } = req;

    // Special case: Allow clients to make status update requests for cancellations
    if (req.userRole === 'client' &&
        method === 'PATCH' &&
        originalUrl.match(/\/api\/work-orders\/\d+\/status/)) {

        // Check if the request body contains status='cancelled'
        if (req.body && req.body.status === 'cancelled') {
            return next(); // Allow client to proceed with cancellation request
        }
    }

    // Regular role-based checks for other operations
    if (['admin', 'staff'].includes(req.userRole)) {
        // Staff and admin can access everything
        return next();
    } else if (req.userRole === 'client') {
        // Clients can only access GET endpoints and specific allowed endpoints
        if (method === 'GET' ||
            // Add other allowed methods for clients here
            (method === 'PATCH' && originalUrl.includes('/api/alerts/'))) {
            return next();
        }
    }

    // If we get here, the user doesn't have permission
    return res.status(403).json({
        success: false,
        message: "Require Williams Property Staff or Admin Role!"
    });
};