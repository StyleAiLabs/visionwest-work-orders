const brevo = require('@getbrevo/brevo');
const { format } = require('date-fns');

// Initialize Brevo API
let defaultClient = brevo.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new brevo.TransactionalEmailsApi();

// Brevo Template IDs from environment variables
const BREVO_TEMPLATES = {
    QUOTE_SUBMITTED: parseInt(process.env.BREVO_TEMPLATE_QUOTE_SUBMITTED || '17'),
    QUOTE_PROVIDED: parseInt(process.env.BREVO_TEMPLATE_QUOTE_PROVIDED || '18'),
    QUOTE_APPROVED: parseInt(process.env.BREVO_TEMPLATE_QUOTE_APPROVED || '19'),
    QUOTE_DECLINED_CLIENT: parseInt(process.env.BREVO_TEMPLATE_QUOTE_DECLINED_CLIENT || '20'),
    QUOTE_INFO_REQUESTED: parseInt(process.env.BREVO_TEMPLATE_QUOTE_INFO_REQUESTED || '21'),
    QUOTE_CONVERTED: parseInt(process.env.BREVO_TEMPLATE_QUOTE_CONVERTED || '22'),
    QUOTE_EXPIRING_SOON: parseInt(process.env.BREVO_TEMPLATE_QUOTE_EXPIRING_SOON || '23'),
    QUOTE_EXPIRED: parseInt(process.env.BREVO_TEMPLATE_QUOTE_EXPIRED || '24'),
};

/**
 * Format currency for display
 * @param {string|number} amount 
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
};

/**
 * Format date for email display
 * @param {Date|string} date 
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
        return format(new Date(date), 'dd MMM yyyy, h:mm a');
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid date';
    }
};

/**
 * Format date without time for email display
 * @param {Date|string} date 
 * @returns {string} Formatted date string
 */
const formatDateOnly = (date) => {
    if (!date) return 'N/A';
    try {
        return format(new Date(date), 'dd MMM yyyy');
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid date';
    }
};

/**
 * Send quote-related email via Brevo
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.recipientName - Recipient's name
 * @param {string} options.type - Email type (QUOTE_SUBMITTED, QUOTE_PROVIDED, etc.)
 * @param {Object} options.quote - Quote object with all necessary details
 * @param {Object} options.additionalParams - Additional template parameters
 * @returns {Promise<void>}
 */
const sendQuoteEmail = async ({ to, recipientName, type, quote, additionalParams = {} }) => {
    try {
        // Validate required parameters
        if (!to || !recipientName || !type || !quote) {
            throw new Error('Missing required email parameters');
        }

        // Get template ID based on type
        const templateId = BREVO_TEMPLATES[type];
        if (!templateId) {
            throw new Error(`Invalid email type: ${type}`);
        }

        // Build base parameters that all templates need
        const baseParams = {
            recipient_name: recipientName,
            quote_number: quote.quote_number || 'N/A',
            property_name: quote.property_name || 'N/A',
            property_address: quote.property_address || 'N/A',
            quote_url: `${process.env.FRONTEND_URL}/quotes/${quote.id}`,
        };

        // Add type-specific parameters
        let params = { ...baseParams };

        switch (type) {
            case 'QUOTE_SUBMITTED':
                params = {
                    ...params,
                    contact_person: quote.contact_person || 'N/A',
                    contact_phone: quote.contact_phone || 'N/A',
                    contact_email: quote.contact_email || 'N/A',
                    issue_description: quote.description || 'N/A',
                    urgency: quote.is_urgent ? 'Urgent' : 'Standard',
                    submitted_at: formatDate(quote.created_at),
                };
                break;

            case 'QUOTE_PROVIDED':
                params = {
                    ...params,
                    estimated_cost: formatCurrency(quote.estimated_cost),
                    quote_valid_until: formatDateOnly(quote.quote_valid_until),
                    quoted_at: formatDate(quote.quoted_at),
                    notes: quote.notes || 'No additional notes',
                };
                break;

            case 'QUOTE_APPROVED':
                params = {
                    ...params,
                    estimated_cost: formatCurrency(quote.estimated_cost),
                    approved_at: formatDate(quote.approved_at),
                    approved_by: additionalParams.approved_by || 'Client Admin',
                };
                break;

            case 'QUOTE_DECLINED_CLIENT':
                params = {
                    ...params,
                    estimated_cost: formatCurrency(quote.estimated_cost),
                    declined_at: formatDate(quote.declined_at),
                    declined_by: additionalParams.declined_by || 'Client Admin',
                    decline_reason: quote.decline_reason || 'No reason provided',
                };
                break;

            case 'QUOTE_INFO_REQUESTED':
                params = {
                    ...params,
                    estimated_cost: formatCurrency(quote.estimated_cost),
                    information_requested: additionalParams.information_requested || 'More information required',
                    requested_at: formatDate(new Date()),
                };
                break;

            case 'QUOTE_CONVERTED':
                params = {
                    ...params,
                    estimated_cost: formatCurrency(quote.estimated_cost),
                    work_order_number: additionalParams.work_order_number || 'N/A',
                    work_order_url: additionalParams.work_order_url || params.quote_url,
                    converted_at: formatDate(new Date()),
                };
                break;

            case 'QUOTE_EXPIRING_SOON':
                params = {
                    ...params,
                    estimated_cost: formatCurrency(quote.estimated_cost),
                    quote_valid_until: formatDateOnly(quote.quote_valid_until),
                    days_until_expiry: additionalParams.days_until_expiry || '3',
                };
                break;

            case 'QUOTE_EXPIRED':
                params = {
                    ...params,
                    estimated_cost: formatCurrency(quote.estimated_cost),
                    expired_date: formatDateOnly(quote.quote_valid_until),
                };
                break;

            default:
                throw new Error(`Unhandled email type: ${type}`);
        }

        // Merge any additional params
        params = { ...params, ...additionalParams };

        // Create email object
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: to, name: recipientName }];
        sendSmtpEmail.templateId = templateId;
        sendSmtpEmail.params = params;

        // Send email
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

        console.log(`✓ Email sent successfully (${type}) to ${to}`);
        console.log('  Message ID:', result.messageId);

        return result;

    } catch (error) {
        console.error(`✗ Failed to send email (${type}) to ${to}:`, error.message);

        // Log detailed error information for debugging
        if (error.response) {
            console.error('  Brevo API error response:', error.response.body);
        }

        // Don't throw - we don't want email failures to break the workflow
        // Just log and continue
        return null;
    }
};

/**
 * Send email to multiple recipients
 * @param {Array} recipients - Array of {email, name} objects
 * @param {string} type - Email type
 * @param {Object} quote - Quote object
 * @param {Object} additionalParams - Additional parameters
 * @returns {Promise<Array>} Array of results
 */
const sendQuoteEmailToMultiple = async (recipients, type, quote, additionalParams = {}) => {
    const results = [];

    for (const recipient of recipients) {
        const result = await sendQuoteEmail({
            to: recipient.email,
            recipientName: recipient.name,
            type,
            quote,
            additionalParams,
        });
        results.push({ recipient: recipient.email, success: !!result });
    }

    return results;
};

module.exports = {
    sendQuoteEmail,
    sendQuoteEmailToMultiple,
    BREVO_TEMPLATES,
};
