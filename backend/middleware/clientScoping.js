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
 * Add client_id to request context from authenticated user's JWT token
 * Supports admin context switching via X-Client-Context header
 */
exports.addClientScope = async (req, res, next) => {

    try {
        // Skip for webhook endpoints (they bypass authentication)
        if (req.path.startsWith('/api/webhook/')) {
            return next();
        }

        // Skip for auth endpoints
        if (req.path.startsWith('/api/auth/')) {
            return next();
        }

        // Skip for health check endpoints and root path ONLY
        // Use originalUrl to check the full path, not just the router-relative path
        if (req.originalUrl === '/api/health' || req.originalUrl === '/') {
            return next();
        }

        // Ensure user is authenticated (auth middleware should run before this)
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Ensure user has clientId in JWT token
        if (!req.user.clientId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is outdated. Please log in again.',
                code: 'TOKEN_MISSING_CLIENT_ID'
            });
        }

        // Admin and Staff context switching via X-Client-Context header
        if (['admin', 'staff'].includes(req.user.role) && req.headers['x-client-context']) {
            const targetClientId = parseInt(req.headers['x-client-context']);

            // Validate the header value is a number
            if (isNaN(targetClientId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid X-Client-Context header. Must be a valid client ID.',
                    code: 'INVALID_CLIENT_CONTEXT_FORMAT'
                });
            }

            // Validate target client exists
            const client = await db.client.findByPk(targetClientId);
            if (!client) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid client context. Client ID ${targetClientId} does not exist.`,
                    code: 'INVALID_CLIENT_CONTEXT'
                });
            }

            // Attach context-switched client ID
            req.clientId = targetClientId;
            req.client = client;
            req.isContextSwitched = true; // For audit logging (renamed from isAdminSwitchedContext)
            req.originalClientId = req.user.clientId; // For audit trail (renamed from adminOriginalClientId)

            // Log context switch
            console.log('========================================');
            console.log(`[${req.user.role.toUpperCase()} CONTEXT SWITCH]`);
            console.log(`User ${req.user.userId} (from client ${req.user.clientId})`);
            console.log(`Switched to client ${targetClientId} (${client.name})`);
            console.log('========================================');

        } else if (req.headers['x-client-context']) {
            // Non-admin/non-staff user attempting to use X-Client-Context header
            return res.status(403).json({
                success: false,
                message: 'Staff or Admin role required for client context switching',
                code: 'FORBIDDEN_CONTEXT_SWITCH'
            });
        } else {
            // Normal user - use client from JWT token
            req.clientId = req.user.clientId;

            // Optionally fetch client details if needed
            const client = await db.client.findByPk(req.clientId);
            if (client) {
                req.client = client;
            }
        }

        // Flag for global admin (can bypass client scoping if needed)
        req.isGlobalAdmin = req.user.role === 'admin';

        next();
    } catch (error) {
        console.error('Client scoping middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing client context',
            error: error.message
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
