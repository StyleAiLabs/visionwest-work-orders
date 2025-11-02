const db = require('../models');
const Notification = db.notification;

/**
 * Quote Notification Service
 *
 * Handles notifications for quote-related events:
 * - Quote submitted
 * - Quote provided by staff
 * - Quote approved/declined
 * - Quote converted to work order
 * - Information requested
 * - Quote expired
 * - Quote renewed
 *
 * Integrates with existing notification system
 */

/**
 * Create in-app notification
 * @param {number} userId - User ID to notify
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {number} quoteId - Quote ID (optional)
 * @param {Object} metadata - Additional metadata (optional)
 */
const createNotification = async (userId, type, message, quoteId = null, metadata = {}) => {
    try {
        await Notification.create({
            user_id: userId,
            type: type,
            message: message,
            quote_id: quoteId,
            metadata: metadata,
            is_read: false,
            created_at: new Date()
        });

        console.log(`✓ Notification created for user ${userId}: ${type}`);
    } catch (error) {
        console.error('Error creating notification:', error);
        // Don't throw - notifications are non-critical
    }
};

/**
 * Get all WPSG staff users for notifications
 * WPSG client_id is 8 based on the codebase
 */
const getWPSGStaffUsers = async () => {
    try {
        const User = db.user;
        const staffUsers = await User.findAll({
            where: {
                client_id: 8, // WPSG client ID
                role: ['staff', 'admin'],
                is_active: true
            },
            attributes: ['id', 'email', 'full_name', 'role']
        });

        return staffUsers;
    } catch (error) {
        console.error('Error fetching WPSG staff users:', error);
        return [];
    }
};

/**
 * Get client users (client_admin and client) for a specific client
 */
const getClientUsers = async (clientId) => {
    try {
        const User = db.user;
        const clientUsers = await User.findAll({
            where: {
                client_id: clientId,
                role: ['client', 'client_admin'],
                is_active: true
            },
            attributes: ['id', 'email', 'full_name', 'role']
        });

        return clientUsers;
    } catch (error) {
        console.error('Error fetching client users:', error);
        return [];
    }
};

/**
 * Notify when quote is submitted for review
 * Notifies: All WPSG staff
 */
exports.notifyQuoteSubmitted = async (quote, submittedBy) => {
    try {
        const staffUsers = await getWPSGStaffUsers();

        const message = `New quote request #${quote.quote_number} submitted by ${submittedBy.full_name} for ${quote.property_name}${quote.is_urgent ? ' (URGENT)' : ''}`;

        for (const staff of staffUsers) {
            await createNotification(
                staff.id,
                'quote_submitted',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    is_urgent: quote.is_urgent,
                    client_id: quote.client_id,
                    property_name: quote.property_name
                }
            );
        }

        // TODO Phase 3+: Send email notifications via n8n
        console.log(`✓ Quote submitted notifications sent to ${staffUsers.length} staff members`);
    } catch (error) {
        console.error('Error sending quote submitted notifications:', error);
    }
};

/**
 * Notify when quote is provided by staff
 * Notifies: Quote creator and all client_admins for that client
 */
exports.notifyQuoteProvided = async (quote, providedBy) => {
    try {
        const clientUsers = await getClientUsers(quote.client_id);

        const message = `Quote #${quote.quote_number} provided by Williams Property. Estimated cost: $${quote.estimated_cost}`;

        for (const user of clientUsers) {
            await createNotification(
                user.id,
                'quote_provided',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    estimated_cost: quote.estimated_cost,
                    estimated_hours: quote.estimated_hours,
                    quote_valid_until: quote.quote_valid_until
                }
            );
        }

        // TODO Phase 3+: Send email notifications via n8n
        console.log(`✓ Quote provided notifications sent to ${clientUsers.length} client users`);
    } catch (error) {
        console.error('Error sending quote provided notifications:', error);
    }
};

/**
 * Notify when quote is approved
 * Notifies: All WPSG staff
 */
exports.notifyQuoteApproved = async (quote, approvedBy) => {
    try {
        const staffUsers = await getWPSGStaffUsers();

        const message = `Quote #${quote.quote_number} approved by ${approvedBy.full_name}. Ready to convert to work order.`;

        for (const staff of staffUsers) {
            await createNotification(
                staff.id,
                'quote_approved',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    approved_by: approvedBy.full_name,
                    estimated_cost: quote.estimated_cost
                }
            );
        }

        // TODO Phase 3+: Send email notifications via n8n
        console.log(`✓ Quote approved notifications sent to ${staffUsers.length} staff members`);
    } catch (error) {
        console.error('Error sending quote approved notifications:', error);
    }
};

/**
 * Notify when quote is declined by staff
 * Notifies: Quote creator and all client_admins for that client
 */
exports.notifyQuoteDeclinedByStaff = async (quote, declinedBy, reason) => {
    try {
        const clientUsers = await getClientUsers(quote.client_id);

        const message = `Quote request #${quote.quote_number} declined by Williams Property. Reason: ${reason}`;

        for (const user of clientUsers) {
            await createNotification(
                user.id,
                'quote_declined',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    declined_by: declinedBy.full_name,
                    decline_reason: reason
                }
            );
        }

        // TODO Phase 3+: Send email notifications via n8n
        console.log(`✓ Quote declined notifications sent to ${clientUsers.length} client users`);
    } catch (error) {
        console.error('Error sending quote declined notifications:', error);
    }
};

/**
 * Notify when quote is declined by client
 * Notifies: All WPSG staff
 */
exports.notifyQuoteDeclinedByClient = async (quote, declinedBy, reason) => {
    try {
        const staffUsers = await getWPSGStaffUsers();

        const message = `Quote #${quote.quote_number} declined by ${declinedBy.full_name}. Reason: ${reason}`;

        for (const staff of staffUsers) {
            await createNotification(
                staff.id,
                'quote_declined_by_client',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    declined_by: declinedBy.full_name,
                    decline_reason: reason
                }
            );
        }

        // TODO Phase 3+: Send email notifications via n8n
        console.log(`✓ Quote declined by client notifications sent to ${staffUsers.length} staff members`);
    } catch (error) {
        console.error('Error sending quote declined by client notifications:', error);
    }
};

/**
 * Notify when quote is converted to work order
 * Notifies: Quote creator and all client_admins for that client
 */
exports.notifyQuoteConverted = async (quote, workOrder, convertedBy) => {
    try {
        const clientUsers = await getClientUsers(quote.client_id);

        const message = `Quote #${quote.quote_number} has been converted to work order #${workOrder.job_no}. Work has been scheduled.`;

        for (const user of clientUsers) {
            await createNotification(
                user.id,
                'quote_converted',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    work_order_id: workOrder.id,
                    job_number: workOrder.job_no,
                    converted_by: convertedBy.full_name
                }
            );
        }

        // TODO Phase 3+: Send email/SMS notifications via n8n
        console.log(`✓ Quote converted notifications sent to ${clientUsers.length} client users`);
    } catch (error) {
        console.error('Error sending quote converted notifications:', error);
    }
};

/**
 * Notify when more information is requested
 * Notifies: Quote creator and all client_admins for that client
 */
exports.notifyInfoRequested = async (quote, requestedBy, message) => {
    try {
        const clientUsers = await getClientUsers(quote.client_id);

        const notificationMessage = `Williams Property needs more information for quote #${quote.quote_number}: ${message}`;

        for (const user of clientUsers) {
            await createNotification(
                user.id,
                'quote_info_requested',
                notificationMessage,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    requested_by: requestedBy.full_name,
                    request_message: message
                }
            );
        }

        // TODO Phase 3+: Send email notifications via n8n
        console.log(`✓ Info requested notifications sent to ${clientUsers.length} client users`);
    } catch (error) {
        console.error('Error sending info requested notifications:', error);
    }
};

/**
 * Notify when quote is expiring soon (3 days before expiry)
 * Notifies: Quote creator and all client_admins for that client
 */
exports.notifyQuoteExpiringSoon = async (quote) => {
    try {
        const clientUsers = await getClientUsers(quote.client_id);

        const expiryDate = new Date(quote.quote_valid_until).toLocaleDateString();
        const message = `Quote #${quote.quote_number} expires in 3 days (${expiryDate}). Please review and approve if you wish to proceed.`;

        for (const user of clientUsers) {
            await createNotification(
                user.id,
                'quote_expiring_soon',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    quote_valid_until: quote.quote_valid_until
                }
            );
        }

        // TODO Phase 13: Send email reminders via n8n
        console.log(`✓ Quote expiring notifications sent to ${clientUsers.length} client users`);
    } catch (error) {
        console.error('Error sending quote expiring notifications:', error);
    }
};

/**
 * Notify when quote has expired
 * Notifies: Quote creator and all client_admins for that client
 */
exports.notifyQuoteExpired = async (quote) => {
    try {
        const clientUsers = await getClientUsers(quote.client_id);

        const message = `Quote #${quote.quote_number} has expired. Please contact Williams Property if you would like to request a renewal.`;

        for (const user of clientUsers) {
            await createNotification(
                user.id,
                'quote_expired',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    expired_at: new Date()
                }
            );
        }

        // TODO Phase 13: Send email notifications via n8n
        console.log(`✓ Quote expired notifications sent to ${clientUsers.length} client users`);
    } catch (error) {
        console.error('Error sending quote expired notifications:', error);
    }
};

/**
 * Notify when quote is renewed
 * Notifies: Quote creator and all client_admins for that client
 */
exports.notifyQuoteRenewed = async (quote, renewedBy) => {
    try {
        const clientUsers = await getClientUsers(quote.client_id);

        const newExpiryDate = new Date(quote.quote_valid_until).toLocaleDateString();
        const message = `Quote #${quote.quote_number} has been renewed by Williams Property. New expiry date: ${newExpiryDate}`;

        for (const user of clientUsers) {
            await createNotification(
                user.id,
                'quote_renewed',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    renewed_by: renewedBy.full_name,
                    new_valid_until: quote.quote_valid_until,
                    estimated_cost: quote.estimated_cost
                }
            );
        }

        // TODO Phase 22: Send email notifications via n8n
        console.log(`✓ Quote renewed notifications sent to ${clientUsers.length} client users`);
    } catch (error) {
        console.error('Error sending quote renewed notifications:', error);
    }
};

/**
 * Notify when new message is added to quote
 * Notifies: Opposite party (if client sends, notify staff; if staff sends, notify client)
 */
exports.notifyNewMessage = async (quote, messageAuthor, messageContent) => {
    try {
        let recipientUsers = [];

        // If message is from client side, notify staff
        if (messageAuthor.role === 'client' || messageAuthor.role === 'client_admin') {
            recipientUsers = await getWPSGStaffUsers();
        } else {
            // If message is from staff, notify client users
            recipientUsers = await getClientUsers(quote.client_id);
        }

        const message = `New message on quote #${quote.quote_number} from ${messageAuthor.full_name}`;

        for (const user of recipientUsers) {
            await createNotification(
                user.id,
                'quote_new_message',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    message_author: messageAuthor.full_name,
                    message_preview: messageContent.substring(0, 100)
                }
            );
        }

        console.log(`✓ New message notifications sent to ${recipientUsers.length} users`);
    } catch (error) {
        console.error('Error sending new message notifications:', error);
    }
};

/**
 * Notify when quote is updated (cost/hours changed)
 * Notifies: Quote creator and all client_admins for that client
 */
exports.notifyQuoteUpdated = async (quote, updatedBy, changes) => {
    try {
        const clientUsers = await getClientUsers(quote.client_id);

        let changesSummary = [];
        if (changes.cost) {
            changesSummary.push(`Cost: $${changes.oldCost} → $${changes.newCost}`);
        }
        if (changes.hours) {
            changesSummary.push(`Hours: ${changes.oldHours} → ${changes.newHours}`);
        }

        const message = `Quote #${quote.quote_number} has been updated by Williams Property. ${changesSummary.join(', ')}`;

        for (const user of clientUsers) {
            await createNotification(
                user.id,
                'quote_updated',
                message,
                quote.id,
                {
                    quote_number: quote.quote_number,
                    updated_by: updatedBy.full_name,
                    changes: changes
                }
            );
        }

        // TODO Phase 17: Send email notifications via n8n
        console.log(`✓ Quote updated notifications sent to ${clientUsers.length} client users`);
    } catch (error) {
        console.error('Error sending quote updated notifications:', error);
    }
};

module.exports = exports;
