const db = require('../models');
const Quote = db.quote;
const User = db.user;

/**
 * Quote Access Control Middleware
 *
 * Implements role-based access control for quotes:
 * - client: Can only access quotes where their email matches authorized_email on the property
 * - client_admin: Can access all quotes for their organization (client_id)
 * - staff/admin: Can access all quotes across all clients (WPSG cross-client access)
 */

/**
 * Check if user can access a specific quote
 * @param {string} role - User role (client, client_admin, staff, admin)
 * @param {number} userClientId - Client ID from JWT
 * @param {string} userEmail - User email for authorized_email matching
 * @param {number} quoteClientId - Client ID of the quote
 * @param {string} quoteAuthorizedEmail - Authorized email on the quote (optional for future use)
 * @returns {boolean} - true if user can access the quote
 */
exports.canAccessQuote = (role, userClientId, userEmail, quoteClientId, quoteAuthorizedEmail = null) => {
    // Staff and Admin can access all quotes (cross-client access)
    if (role === 'staff' || role === 'admin') {
        return true;
    }

    // Client_admin can access all quotes for their organization
    if (role === 'client_admin') {
        return userClientId === quoteClientId;
    }

    // Client can only access quotes for their organization
    // In Phase 14 (US1.2), we'll add authorized_email filtering
    if (role === 'client') {
        // For now, just check client_id match
        // TODO Phase 14: Add authorized_email matching
        return userClientId === quoteClientId;
    }

    return false;
};

/**
 * Middleware to verify user has access to quote
 * Use this on routes that operate on a specific quote (GET /quotes/:id, PATCH /quotes/:id, etc.)
 */
exports.verifyQuoteAccess = async (req, res, next) => {
    try {
        const quoteId = req.params.id;
        const userRole = req.userRole;
        const userClientId = req.clientId;

        // Staff and admin always have access
        if (userRole === 'staff' || userRole === 'admin') {
            return next();
        }

        // Find the quote
        const quote = await Quote.findByPk(quoteId);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        // Check if user can access this quote
        const hasAccess = exports.canAccessQuote(
            userRole,
            userClientId,
            req.user?.email,
            quote.client_id
        );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this quote'
            });
        }

        // Attach quote to request for use in controller
        req.quote = quote;
        next();
    } catch (error) {
        console.error('Quote access verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying quote access'
        });
    }
};

/**
 * Apply role-based filtering for quote list queries
 * Use this on list endpoints (GET /quotes)
 */
exports.applyQuoteFiltering = (req, res, next) => {
    const userRole = req.userRole;
    const userClientId = req.clientId;

    // Initialize filter object
    if (!req.quoteFilter) {
        req.quoteFilter = {};
    }

    // Staff and admin: No filtering (can see all quotes)
    if (userRole === 'staff' || userRole === 'admin') {
        return next();
    }

    // Client_admin: Filter by client_id
    if (userRole === 'client_admin') {
        req.quoteFilter.client_id = userClientId;
        return next();
    }

    // Client: Filter by client_id (and authorized_email in Phase 14)
    if (userRole === 'client') {
        req.quoteFilter.client_id = userClientId;
        // TODO Phase 14: Add authorized_email filtering
        return next();
    }

    // Default: No access
    return res.status(403).json({
        success: false,
        message: 'Invalid role for quote access'
    });
};

/**
 * Middleware to check if user can create quotes
 * Client, client_admin, and admin can create quotes
 * According to access matrix:
 * - Client (Housing Coordinator): ✅ For properties they manage
 * - Client Admin (Property Manager): ✅ All org properties
 * - Admin: ✅
 */
exports.canCreateQuote = (req, res, next) => {
    const userRole = req.userRole;

    if (userRole === 'client' || userRole === 'client_admin' || userRole === 'admin') {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'You do not have permission to create quotes. Only client users can create quote requests.'
    });
};

/**
 * Middleware to check if user can approve/decline quotes
 * Only client_admin and admin can approve/decline quotes
 */
exports.canApproveQuote = (req, res, next) => {
    const userRole = req.userRole;

    if (userRole === 'client_admin' || userRole === 'admin') {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Only client administrators can approve or decline quotes'
    });
};

/**
 * Middleware to check if user is staff/admin
 * For operations like providing quotes, requesting info, declining requests, converting to work orders
 */
exports.isStaffOrAdmin = (req, res, next) => {
    const userRole = req.userRole;

    if (userRole === 'staff' || userRole === 'admin') {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'This operation requires Williams Property staff or admin access'
    });
};
