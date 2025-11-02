const db = require('../models');
const Quote = db.quote;

/**
 * Quote Service
 *
 * Provides utility functions for quote operations including:
 * - Auto-generation of unique quote numbers
 * - Quote business logic helpers
 */

/**
 * Generate unique quote number in format: QTE-YYYY-###
 *
 * @returns {Promise<string>} - Unique quote number (e.g., "QTE-2025-001")
 *
 * Algorithm:
 * 1. Get current year
 * 2. Find the highest quote number for this year
 * 3. Increment by 1, or start at 1 if no quotes exist for this year
 * 4. Format as QTE-YYYY-### with zero-padding (minimum 3 digits)
 */
exports.generateQuoteNumber = async () => {
    try {
        const currentYear = new Date().getFullYear();
        const prefix = `QTE-${currentYear}-`;

        // Find the latest quote number for the current year
        const latestQuote = await Quote.findOne({
            where: {
                quote_number: {
                    [db.Sequelize.Op.like]: `${prefix}%`
                }
            },
            order: [['quote_number', 'DESC']],
            attributes: ['quote_number']
        });

        let nextNumber = 1;

        if (latestQuote) {
            // Extract the numeric part from the latest quote number
            // Example: "QTE-2025-042" -> "042" -> 42
            const lastNumber = latestQuote.quote_number.split('-')[2];
            nextNumber = parseInt(lastNumber, 10) + 1;
        }

        // Format with zero-padding (minimum 3 digits)
        const paddedNumber = nextNumber.toString().padStart(3, '0');

        return `${prefix}${paddedNumber}`;
    } catch (error) {
        console.error('Error generating quote number:', error);
        throw new Error('Failed to generate quote number');
    }
};

/**
 * Check if quote is expired
 * @param {Object} quote - Quote object with quote_valid_until field
 * @returns {boolean} - true if quote is expired
 */
exports.isQuoteExpired = (quote) => {
    if (!quote.quote_valid_until) {
        return false; // No expiry date means not expired
    }

    const now = new Date();
    const validUntil = new Date(quote.quote_valid_until);

    return now > validUntil;
};

/**
 * Get default validity period for a quote (30 days from now)
 * @returns {Date} - Date 30 days from now
 */
exports.getDefaultValidityDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Add 30 days
    return date;
};

/**
 * Check if quote can be approved
 * @param {Object} quote - Quote object
 * @returns {Object} - { canApprove: boolean, reason: string }
 */
exports.canApproveQuote = (quote) => {
    // Must be in 'Quoted' status
    if (quote.status !== 'Quoted') {
        return {
            canApprove: false,
            reason: `Quote must be in 'Quoted' status. Current status: ${quote.status}`
        };
    }

    // Must not be expired
    if (exports.isQuoteExpired(quote)) {
        return {
            canApprove: false,
            reason: 'Quote has expired and cannot be approved. Please request a renewal from Williams Property.'
        };
    }

    return {
        canApprove: true,
        reason: null
    };
};

/**
 * Check if quote can be converted to work order
 * @param {Object} quote - Quote object
 * @returns {Object} - { canConvert: boolean, reason: string }
 */
exports.canConvertToWorkOrder = (quote) => {
    // Must be in 'Approved' status
    if (quote.status !== 'Approved') {
        return {
            canConvert: false,
            reason: `Quote must be approved before conversion. Current status: ${quote.status}`
        };
    }

    // Must not already be converted
    if (quote.converted_to_work_order_id) {
        return {
            canConvert: false,
            reason: 'Quote has already been converted to a work order'
        };
    }

    return {
        canConvert: true,
        reason: null
    };
};

/**
 * Validate quote status transition
 * @param {string} currentStatus - Current quote status
 * @param {string} newStatus - Desired new status
 * @returns {Object} - { isValid: boolean, reason: string }
 */
exports.validateStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        'Draft': ['Submitted'],
        'Submitted': ['Information Requested', 'Quoted', 'Declined'],
        'Information Requested': ['Submitted'], // Client responds
        'Quoted': ['Approved', 'Declined', 'Under Discussion', 'Expired'],
        'Under Discussion': ['Quoted'], // Staff updates quote
        'Expired': ['Quoted'], // Staff renews quote
        'Approved': ['Converted'],
        'Declined': [], // Terminal state
        'Converted': [] // Terminal state
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (allowedTransitions.includes(newStatus)) {
        return { isValid: true, reason: null };
    }

    return {
        isValid: false,
        reason: `Invalid status transition from '${currentStatus}' to '${newStatus}'`
    };
};

module.exports = exports;
