const db = require('../models');

/**
 * Client Scoping Middleware
 *
 * Purpose: Automatically filter all database queries by the authenticated user's client_id
 * to ensure data isolation between clients in a multi-tenant environment.
 *
 * This middleware adds client_id to request context after authentication.
 * It should be applied after verifyToken middleware.
 *
 * Usage:
 * - Apply to all routes that need client-scoped data access
 * - Global admins (role: 'admin') bypass client scoping
 * - Staff can optionally access all clients (for P2 cross-client features)
 */

/**
 * Add client_id to request context from authenticated user
 */
exports.addClientScope = async (req, res, next) => {
    try {
        // User ID should be available from auth middleware
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Fetch user with client_id
        const user = await db.user.findByPk(req.userId, {
            attributes: ['id', 'email', 'role', 'client_id'],
            include: [{
                model: db.client,
                as: 'client',
                attributes: ['id', 'name', 'code', 'status']
            }]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.client) {
            return res.status(500).json({
                success: false,
                message: 'User has no associated client organization'
            });
        }

        // Check if client is active
        if (user.client.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your organization account is inactive. Please contact support.'
            });
        }

        // Add client context to request
        req.clientId = user.client_id;
        req.client = user.client;

        // Flag for global admin (can bypass client scoping if needed)
        req.isGlobalAdmin = user.role === 'admin';

        next();
    } catch (error) {
        console.error('Client scoping middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing client context'
        });
    }
};

/**
 * Apply client filter to Sequelize query options
 * Helper function to be used in controllers
 *
 * @param {Object} req - Express request object (must have clientId)
 * @param {Object} whereClause - Existing where clause to extend
 * @returns {Object} - Where clause with client_id added
 */
exports.applyClientFilter = (req, whereClause = {}) => {
    // Global admins can optionally bypass client scoping
    // For now, we always scope by client unless explicitly needed
    if (req.clientId) {
        return {
            ...whereClause,
            client_id: req.clientId
        };
    }

    return whereClause;
};

/**
 * Validate that a resource belongs to the user's client
 * Used when updating/deleting specific resources
 *
 * @param {Object} resource - Database record to check
 * @param {Number} clientId - Expected client_id
 * @throws {Error} - If resource doesn't belong to client
 */
exports.validateClientOwnership = (resource, clientId) => {
    if (!resource) {
        const error = new Error('Resource not found');
        error.statusCode = 404;
        throw error;
    }

    if (resource.client_id !== clientId) {
        const error = new Error('Access denied: Resource belongs to another organization');
        error.statusCode = 403;
        throw error;
    }

    return true;
};

/**
 * Middleware to enforce client scoping on create operations
 * Automatically adds client_id to request body
 */
exports.enforceClientOnCreate = (req, res, next) => {
    if (!req.clientId) {
        return res.status(401).json({
            success: false,
            message: 'Client context not available'
        });
    }

    // Automatically add client_id to request body for create operations
    if (req.body) {
        req.body.client_id = req.clientId;
    }

    next();
};

/**
 * Middleware to validate client_id in URL params matches user's client
 * Use this for routes like /api/clients/:clientId/...
 */
exports.validateClientParam = (req, res, next) => {
    const paramClientId = parseInt(req.params.clientId);

    // Global admins can access any client
    if (req.isGlobalAdmin) {
        return next();
    }

    // Regular users must match their own client
    if (paramClientId !== req.clientId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied: Cannot access another organization\'s data'
        });
    }

    next();
};
