const { Op } = require('sequelize');
const db = require('../models');
const quoteService = require('../services/quoteService');
const quoteNotificationService = require('../services/quoteNotificationService');

const Quote = db.quote;
const QuoteMessage = db.quoteMessage;
const QuoteAttachment = db.quoteAttachment;
const User = db.user;
const Client = db.client;

/**
 * Quote Controller
 *
 * Handles all quote-related operations:
 * - Create, update, submit quote requests
 * - Provide quotes (staff)
 * - Approve/decline quotes (client_admin)
 * - Convert to work orders (staff)
 * - Messaging and attachments
 */

// ============================================================================
// T014: Create new quote (POST /api/quotes)
// ============================================================================
exports.createQuote = async (req, res) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole;
        const clientId = req.clientId;

        console.log('=== CREATE QUOTE DEBUG ===');
        console.log('User ID:', userId);
        console.log('User Role:', userRole);
        console.log('Client ID:', clientId);

        // Extract quote data from request body
        const {
            property_name,
            property_address,
            property_phone,
            title,
            work_type,
            description,
            scope_of_work,
            contact_person,
            contact_email,
            contact_phone,
            is_urgent,
            required_by_date
        } = req.body;

        // T017: Validation - Required fields
        if (!property_name || !property_address || !title || !description || !contact_person || !contact_email) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                required: ['property_name', 'property_address', 'title', 'description', 'contact_person', 'contact_email']
            });
        }

        // T017: Validation - Description minimum 20 characters
        if (description.length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Description must be at least 20 characters long'
            });
        }

        // T017: Validation - Email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact_email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format for contact_email'
            });
        }

        // T017: Validation - Character limits
        if (title.length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Title must not exceed 255 characters'
            });
        }

        // T018: Client scoping - Use client_id from JWT (enforced by middleware)
        // Client_admin and admin create quotes for their client organization
        const quoteClientId = clientId;

        // Validation: WPSG users (staff/admin) cannot create quotes for WPSG
        // WPSG is the service provider, not a client requesting quotes
        if (quoteClientId === 8 && (userRole === 'staff' || userRole === 'admin')) {
            return res.status(400).json({
                success: false,
                message: 'WPSG users cannot create quote requests. Quotes are created by client organizations.'
            });
        }

        // Create quote with status 'Draft'
        const quote = await Quote.create({
            quote_number: 'TEMP', // Will be generated on submit
            client_id: quoteClientId,
            status: 'Draft',
            property_name,
            property_address,
            property_phone: property_phone || null,
            title,
            work_type: work_type || null,
            description,
            scope_of_work: scope_of_work || null,
            contact_person,
            contact_email,
            contact_phone: contact_phone || null,
            is_urgent: is_urgent || false,
            required_by_date: required_by_date || null,
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log('✓ Quote created:', quote.id);

        return res.status(201).json({
            success: true,
            message: 'Quote draft created successfully',
            data: quote
        });

    } catch (error) {
        console.error('Error creating quote:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating quote',
            error: error.message
        });
    }
};

// ============================================================================
// T015: Update draft quote (PATCH /api/quotes/:id)
// ============================================================================
exports.updateQuote = async (req, res) => {
    try {
        const quoteId = req.params.id;
        const userId = req.userId;

        console.log('=== UPDATE QUOTE DEBUG ===');
        console.log('Quote ID:', quoteId);
        console.log('User ID:', userId);

        // Find the quote
        const quote = await Quote.findByPk(quoteId);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        // Only allow updating quotes in 'Draft' status
        if (quote.status !== 'Draft') {
            return res.status(400).json({
                success: false,
                message: `Cannot update quote with status '${quote.status}'. Only draft quotes can be updated.`
            });
        }

        // Extract updatable fields from request body
        const {
            property_name,
            property_address,
            property_phone,
            title,
            work_type,
            description,
            scope_of_work,
            contact_person,
            contact_email,
            contact_phone,
            is_urgent,
            required_by_date
        } = req.body;

        // Build update object with only provided fields
        const updateData = {};
        if (property_name !== undefined) updateData.property_name = property_name;
        if (property_address !== undefined) updateData.property_address = property_address;
        if (property_phone !== undefined) updateData.property_phone = property_phone;
        if (title !== undefined) updateData.title = title;
        if (work_type !== undefined) updateData.work_type = work_type;
        if (description !== undefined) updateData.description = description;
        if (scope_of_work !== undefined) updateData.scope_of_work = scope_of_work;
        if (contact_person !== undefined) updateData.contact_person = contact_person;
        if (contact_email !== undefined) updateData.contact_email = contact_email;
        if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
        if (is_urgent !== undefined) updateData.is_urgent = is_urgent;
        if (required_by_date !== undefined) updateData.required_by_date = required_by_date;
        updateData.updated_at = new Date();

        // T017: Validation if fields are being updated
        if (updateData.description && updateData.description.length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Description must be at least 20 characters long'
            });
        }

        if (updateData.contact_email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updateData.contact_email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format for contact_email'
                });
            }
        }

        if (updateData.title && updateData.title.length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Title must not exceed 255 characters'
            });
        }

        // Update the quote
        await quote.update(updateData);

        console.log('✓ Quote updated:', quote.id);

        return res.status(200).json({
            success: true,
            message: 'Quote updated successfully',
            data: quote
        });

    } catch (error) {
        console.error('Error updating quote:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating quote',
            error: error.message
        });
    }
};

// ============================================================================
// T016: Submit quote for review (POST /api/quotes/:id/submit)
// ============================================================================
exports.submitQuote = async (req, res) => {
    try {
        const quoteId = req.params.id;
        const userId = req.userId;

        console.log('=== SUBMIT QUOTE DEBUG ===');
        console.log('Quote ID:', quoteId);
        console.log('User ID:', userId);

        // Find the quote with user details
        const quote = await Quote.findByPk(quoteId, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'email', 'role']
                }
            ]
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        // Only allow submitting quotes in 'Draft' status
        if (quote.status !== 'Draft') {
            return res.status(400).json({
                success: false,
                message: `Cannot submit quote with status '${quote.status}'. Only draft quotes can be submitted.`
            });
        }

        // T017: Final validation before submission
        if (!quote.property_name || !quote.property_address || !quote.title ||
            !quote.description || !quote.contact_person || !quote.contact_email) {
            return res.status(400).json({
                success: false,
                message: 'Cannot submit incomplete quote. Please fill in all required fields.',
                required: ['property_name', 'property_address', 'title', 'description', 'contact_person', 'contact_email']
            });
        }

        if (quote.description.length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Description must be at least 20 characters before submitting'
            });
        }

        // T011: Generate unique quote number
        const quoteNumber = await quoteService.generateQuoteNumber();

        // Update quote status to 'Submitted' and set quote_number
        await quote.update({
            status: 'Submitted',
            quote_number: quoteNumber,
            submitted_at: new Date(),
            updated_at: new Date()
        });

        console.log('✓ Quote submitted:', quote.id, quoteNumber);

        // T019: Send notifications to WPSG staff
        try {
            await quoteNotificationService.notifyQuoteSubmitted(quote, quote.creator);
            console.log('✓ Quote submission notifications sent');
        } catch (notifError) {
            console.error('Error sending quote submission notifications:', notifError);
            // Don't fail the request if notifications fail
        }

        return res.status(200).json({
            success: true,
            message: 'Quote submitted successfully',
            data: {
                ...quote.toJSON(),
                quote_number: quoteNumber
            }
        });

    } catch (error) {
        console.error('Error submitting quote:', error);
        return res.status(500).json({
            success: false,
            message: 'Error submitting quote',
            error: error.message
        });
    }
};

// ============================================================================
// T030-T034: Phase 4 - Staff Views Pending Quotes
// ============================================================================

// T030: Get all quotes with role-based filtering and pagination
exports.getAllQuotes = async (req, res) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole;
        const clientId = req.clientId;

        console.log('=== GET ALL QUOTES DEBUG ===');
        console.log('User ID:', userId);
        console.log('User Role:', userRole);
        console.log('Client ID:', clientId);
        console.log('Query params:', req.query);

        // T033: Extract query filters
        const {
            status,
            urgency,
            search,
            dateFrom,
            dateTo,
            clientId: filterClientId,
            sortBy = 'created_at',
            sortOrder = 'DESC',
            page = 1,
            limit = 20
        } = req.query;

        console.log('Extracted filters:', { status, urgency, search, dateFrom, dateTo, filterClientId, sortBy, sortOrder, page, limit });

        // Build where clause based on role
        let whereClause = {};

        // T030: Role-based filtering
        if (userRole === 'staff' || userRole === 'admin') {
            // Staff/Admin: See all quotes across all clients
            // If filterClientId is provided, apply it
            if (filterClientId) {
                whereClause.client_id = filterClientId;
            }
        } else if (userRole === 'client_admin') {
            // Client_admin: Only see quotes for their organization
            whereClause.client_id = clientId;
        } else if (userRole === 'client') {
            // Client: Only see quotes for their organization
            // TODO Phase 14: Add authorized_email filtering
            whereClause.client_id = clientId;
        }

        // T033: Apply additional filters
        if (status) {
            whereClause.status = status;
        }

        if (urgency !== undefined && urgency !== '' && urgency !== null) {
            whereClause.is_urgent = urgency === 'true' || urgency === true;
        }

        // T033: Search filter (quote number, property name, description)
        if (search) {
            whereClause[Op.or] = [
                { quote_number: { [Op.iLike]: `%${search}%` } },
                { property_name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
                { title: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // T033: Date range filter
        if (dateFrom || dateTo) {
            whereClause.created_at = {};
            if (dateFrom) {
                whereClause.created_at[Op.gte] = new Date(dateFrom);
            }
            if (dateTo) {
                whereClause.created_at[Op.lte] = new Date(dateTo);
            }
        }

        // T034: Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        console.log('Final whereClause:', JSON.stringify(whereClause, null, 2));
        console.log('Pagination:', { page: parseInt(page), limit: parseInt(limit), offset });

        // Fetch quotes with pagination
        const { count, rows: quotes } = await Quote.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'email', 'role']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'code']
                }
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset: offset
        });

        console.log(`✓ Found ${count} quotes, returning page ${page}`);

        return res.status(200).json({
            success: true,
            data: quotes,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching quotes:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching quotes',
            error: error.message
        });
    }
};

// T031: Get quote by ID with access control
exports.getQuoteById = async (req, res) => {
    try {
        const quoteId = req.params.id;

        console.log('=== GET QUOTE BY ID DEBUG ===');
        console.log('Quote ID:', quoteId);

        // Find quote with all associations
        const quote = await Quote.findByPk(quoteId, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'email', 'role', 'phone_number']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: QuoteMessage,
                    as: 'messages',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'full_name', 'email', 'role']
                        }
                    ],
                    order: [['created_at', 'DESC']]
                },
                {
                    model: QuoteAttachment,
                    as: 'attachments',
                    include: [
                        {
                            model: User,
                            as: 'uploader',
                            attributes: ['id', 'full_name']
                        }
                    ]
                }
            ]
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        // Access control is already handled by verifyQuoteAccess middleware
        // If we got here, user has access

        console.log('✓ Quote found:', quote.quote_number);

        return res.status(200).json({
            success: true,
            data: quote
        });

    } catch (error) {
        console.error('Error fetching quote by ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching quote details',
            error: error.message
        });
    }
};

// T032: Get quote summary for dashboard
exports.getQuoteSummary = async (req, res) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole;
        const clientId = req.clientId;

        console.log('=== GET QUOTE SUMMARY DEBUG ===');
        console.log('User ID:', userId);
        console.log('User Role:', userRole);
        console.log('Client ID:', clientId);

        // Build base where clause based on role
        let baseWhere = {};

        if (userRole === 'staff' || userRole === 'admin') {
            // Staff/Admin: See all quotes
            // No filter
        } else if (userRole === 'client_admin') {
            // Client_admin: Only their organization
            baseWhere.client_id = clientId;
        } else if (userRole === 'client') {
            // Client: Only their organization
            // TODO Phase 14: Add authorized_email filtering
            baseWhere.client_id = clientId;
        }

        // Count quotes by status
        const statusCounts = await Promise.all([
            Quote.count({ where: { ...baseWhere, status: 'Draft' } }),
            Quote.count({ where: { ...baseWhere, status: 'Submitted' } }),
            Quote.count({ where: { ...baseWhere, status: 'Information Requested' } }),
            Quote.count({ where: { ...baseWhere, status: 'Quoted' } }),
            Quote.count({ where: { ...baseWhere, status: 'Under Discussion' } }),
            Quote.count({ where: { ...baseWhere, status: 'Approved' } }),
            Quote.count({ where: { ...baseWhere, status: 'Declined' } }),
            Quote.count({ where: { ...baseWhere, status: 'Expired' } }),
            Quote.count({ where: { ...baseWhere, status: 'Converted' } }),
            Quote.count({ where: { ...baseWhere, is_urgent: true, status: { [Op.notIn]: ['Declined', 'Converted'] } } })
        ]);

        const summary = {
            draft: statusCounts[0],
            submitted: statusCounts[1],
            information_requested: statusCounts[2],
            quoted: statusCounts[3],
            under_discussion: statusCounts[4],
            approved: statusCounts[5],
            declined: statusCounts[6],
            expired: statusCounts[7],
            converted: statusCounts[8],
            urgent: statusCounts[9],
            total: statusCounts.slice(0, 9).reduce((sum, count) => sum + count, 0)
        };

        console.log('✓ Quote summary:', summary);

        return res.status(200).json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error('Error fetching quote summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching quote summary',
            error: error.message
        });
    }
};

// ============================================================================
// T052: Staff provides quote (PATCH /api/quotes/:id/provide-quote)
// ============================================================================
exports.provideQuote = async (req, res) => {
    try {
        const quoteId = req.params.id;
        const userId = req.userId;
        const {
            estimated_cost,
            estimated_hours,
            quote_notes,
            quote_valid_until,
            itemized_breakdown
        } = req.body;

        console.log('=== PROVIDE QUOTE DEBUG ===');
        console.log('Quote ID:', quoteId);
        console.log('User ID:', userId);
        console.log('Estimated Cost:', estimated_cost);
        console.log('Estimated Hours:', estimated_hours);

        // Find the quote
        const quote = await Quote.findByPk(quoteId, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'email']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'code']
                }
            ]
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        // Check quote is in correct status
        if (quote.status !== 'Submitted' && quote.status !== 'Information Requested') {
            return res.status(400).json({
                success: false,
                message: `Cannot provide quote for status: ${quote.status}. Quote must be Submitted or Information Requested.`
            });
        }

        // T053: Validation
        if (!estimated_cost || estimated_cost <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Estimated cost must be greater than 0'
            });
        }

        if (!estimated_hours || estimated_hours <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Estimated hours must be greater than 0'
            });
        }

        // Validate validity date is in the future
        if (quote_valid_until) {
            const validityDate = new Date(quote_valid_until);
            const now = new Date();
            if (validityDate <= now) {
                return res.status(400).json({
                    success: false,
                    message: 'Quote validity date must be in the future'
                });
            }
        }

        // T054: Update quote with provided details
        await quote.update({
            status: 'Quoted',
            estimated_cost: parseFloat(estimated_cost),
            estimated_hours: parseFloat(estimated_hours),
            quote_notes: quote_notes || null,
            quote_valid_until: quote_valid_until || null,
            itemized_breakdown: itemized_breakdown || null,
            quoted_at: new Date()
        });

        // T054: Create QuoteMessage record
        await QuoteMessage.create({
            quote_id: quoteId,
            user_id: userId,
            message_type: 'quote_provided',
            message: `Quote provided: $${estimated_cost}, ${estimated_hours} hours. ${quote_notes || ''}`,
            previous_cost: null,
            new_cost: parseFloat(estimated_cost),
            previous_hours: null,
            new_hours: parseFloat(estimated_hours),
            created_at: new Date()
        });

        console.log('✓ Quote provided successfully:', quote.quote_number);

        // T056: Send notification to client
        await quoteNotificationService.notifyQuoteProvided(quote, quote.creator);

        // Reload quote with associations
        const updatedQuote = await Quote.findByPk(quoteId, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'email', 'role']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: QuoteMessage,
                    as: 'messages',
                    include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }]
                }
            ]
        });

        return res.status(200).json({
            success: true,
            message: 'Quote provided successfully',
            data: updatedQuote
        });

    } catch (error) {
        console.error('Error providing quote:', error);
        return res.status(500).json({
            success: false,
            message: 'Error providing quote',
            error: error.message
        });
    }
};

// ============================================================================
// T076: Client admin approves quote (PATCH /api/quotes/:id/approve)
// ============================================================================
exports.approveQuote = async (req, res) => {
    try {
        const quoteId = req.params.id;
        const userId = req.userId;
        const userRole = req.userRole;
        const clientId = req.clientId;

        console.log('=== APPROVE QUOTE DEBUG ===');
        console.log('Quote ID:', quoteId);
        console.log('User ID:', userId);
        console.log('User Role:', userRole);

        // Find the quote
        const quote = await Quote.findByPk(quoteId, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'email']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'code']
                }
            ]
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        // Check quote is in correct status
        if (quote.status !== 'Quoted') {
            return res.status(400).json({
                success: false,
                message: `Cannot approve quote with status: ${quote.status}. Quote must be Quoted.`
            });
        }

        // T078: Validate only client_admin can approve (not regular client role)
        if (userRole !== 'client_admin' && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only client administrators can approve quotes'
            });
        }

        // Verify user belongs to same client as quote (unless admin)
        if (userRole !== 'admin' && quote.client_id !== clientId) {
            return res.status(403).json({
                success: false,
                message: 'You can only approve quotes for your organization'
            });
        }

        // T077: Validate quote not expired
        if (quote.quote_valid_until) {
            const now = new Date();
            const validityDate = new Date(quote.quote_valid_until);
            if (validityDate < now) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot approve expired quote. Quote validity date has passed.',
                    expired: true,
                    valid_until: quote.quote_valid_until
                });
            }
        }

        // T079: Update quote status to Approved
        await quote.update({
            status: 'Approved',
            approved_at: new Date()
        });

        // T079: Create QuoteMessage record
        const approver = await User.findByPk(userId, {
            attributes: ['id', 'full_name', 'email', 'role']
        });

        await QuoteMessage.create({
            quote_id: quoteId,
            user_id: userId,
            message_type: 'approved',
            message: `Quote approved by ${approver.full_name}. Ready to convert to work order.`,
            created_at: new Date()
        });

        console.log('✓ Quote approved successfully:', quote.quote_number);

        // T081: Send notification to WPSG staff
        await quoteNotificationService.notifyQuoteApproved(quote, approver);

        // Reload quote with associations
        const updatedQuote = await Quote.findByPk(quoteId, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'email', 'role']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: QuoteMessage,
                    as: 'messages',
                    include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }]
                }
            ]
        });

        return res.status(200).json({
            success: true,
            message: 'Quote approved successfully',
            data: updatedQuote
        });

    } catch (error) {
        console.error('Error approving quote:', error);
        return res.status(500).json({
            success: false,
            message: 'Error approving quote',
            error: error.message
        });
    }
};

// ============================================================================
// T088-T097: Convert approved quote to work order (POST /api/quotes/:id/convert)
// ============================================================================
exports.convertToWorkOrder = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const quoteId = req.params.id;
        const userId = req.userId;
        const { supplier_name, schedule_date, po_number } = req.body;

        console.log('=== CONVERT QUOTE TO WORK ORDER ===');
        console.log('Quote ID:', quoteId);
        console.log('User ID:', userId);
        console.log('Request body:', req.body);

        // T089: Validate quote exists and status is 'Approved'
        const quote = await Quote.findByPk(quoteId, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'email']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: QuoteAttachment,
                    as: 'attachments'
                }
            ],
            transaction
        });

        if (!quote) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        if (quote.status !== 'Approved') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot convert quote with status '${quote.status}'. Only approved quotes can be converted to work orders.`
            });
        }

        // Check if quote already converted
        if (quote.converted_to_work_order_id) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Quote has already been converted to work order.`,
                existingWorkOrderId: quote.converted_to_work_order_id
            });
        }

        // T090: Generate work order job_no (format: RBWO######)
        const WorkOrder = db.workOrder;
        const latestWorkOrder = await WorkOrder.findOne({
            where: {
                job_no: { [Op.like]: 'RBWO%' }
            },
            order: [['id', 'DESC']],
            transaction
        });

        let jobNumber;
        if (latestWorkOrder && latestWorkOrder.job_no) {
            const lastNumber = parseInt(latestWorkOrder.job_no.substring(4)); // Extract number after "RBWO"
            const nextNumber = lastNumber + 1;
            jobNumber = `RBWO${String(nextNumber).padStart(6, '0')}`;
        } else {
            jobNumber = 'RBWO000001';
        }

        console.log('Generated job number:', jobNumber);

        // Get user for authorized_by fields
        const user = await User.findByPk(userId, {
            attributes: ['full_name', 'email', 'phone_number'],
            transaction
        });

        // T091: Create work order with quote data
        const workOrder = await WorkOrder.create({
            job_no: jobNumber,
            date: schedule_date || new Date(),
            status: 'pending',
            work_order_type: 'from_quote',
            supplier_name: supplier_name || 'Williams Property Service',
            supplier_phone: '021 123 4567',
            supplier_email: 'info@williamspropertyservices.co.nz',
            property_name: quote.property_name,
            property_address: quote.property_address,
            property_phone: quote.property_phone || '',
            description: quote.description,
            po_number: po_number || null,
            authorized_by: user ? user.full_name : '',
            authorized_contact: user ? user.phone_number : '',
            authorized_email: quote.contact_email,
            created_by: userId,
            client_id: quote.client_id,
            is_urgent: quote.is_urgent,
            created_from_quote_id: quoteId,
            quote_number: quote.quote_number,
            createdAt: new Date(),
            updatedAt: new Date()
        }, { transaction });

        console.log('✓ Work order created:', workOrder.id, workOrder.job_no);

        // T092: Copy quote attachments to work order
        const Photo = db.photo;
        const WorkOrderNote = db.workOrderNote;
        let imageCount = 0;
        let documentCount = 0;

        if (quote.attachments && quote.attachments.length > 0) {
            for (const attachment of quote.attachments) {
                if (attachment.file_type === 'image' || attachment.file_type === 'photo') {
                    // Copy images to photos table
                    await Photo.create({
                        work_order_id: workOrder.id,
                        photo_url: attachment.file_url,
                        uploaded_by: userId,
                        uploaded_at: new Date()
                    }, { transaction });
                    imageCount++;
                } else if (attachment.file_type === 'document') {
                    // Add documents as work order notes with download links
                    await WorkOrderNote.create({
                        work_order_id: workOrder.id,
                        note: `📄 Document from Quote: ${attachment.file_name}\nDownload: ${attachment.file_url}`,
                        created_by: userId,
                        created_at: new Date()
                    }, { transaction });
                    documentCount++;
                }
            }
            console.log(`✓ Copied ${imageCount} images and ${documentCount} documents to work order`);
        }

        // T093: Create work order note with quote reference
        await WorkOrderNote.create({
            work_order_id: workOrder.id,
            note: `Created from Quote ${quote.quote_number}. Estimated cost: $${parseFloat(quote.estimated_cost).toFixed(2)}, Estimated hours: ${parseFloat(quote.estimated_hours).toFixed(1)} hours.`,
            created_by: userId,
            created_at: new Date()
        }, { transaction });

        console.log('✓ Work order note created');

        // T094: Update quote status to 'Converted'
        await quote.update({
            status: 'Converted',
            converted_at: new Date(),
            converted_to_work_order_id: workOrder.id,
            updated_at: new Date()
        }, { transaction });

        console.log('✓ Quote status updated to Converted');

        // Create quote message for audit trail
        await QuoteMessage.create({
            quote_id: quoteId,
            user_id: userId,
            message_type: 'converted',
            message: `Quote converted to Work Order ${jobNumber} by ${user ? user.full_name : 'staff member'}.`,
            created_at: new Date()
        }, { transaction });

        // T096: Commit transaction
        await transaction.commit();

        console.log('✓✓✓ Quote successfully converted to work order:', jobNumber);

        // T098: Send notification to client (outside transaction)
        await quoteNotificationService.notifyQuoteConverted(quote, workOrder, user);

        return res.status(201).json({
            success: true,
            message: `Quote successfully converted to Work Order ${jobNumber}`,
            data: {
                workOrder: {
                    id: workOrder.id,
                    job_no: workOrder.job_no,
                    status: workOrder.status,
                    created_at: workOrder.createdAt
                },
                quote: {
                    id: quote.id,
                    quote_number: quote.quote_number,
                    status: 'Converted',
                    converted_at: quote.converted_at
                }
            }
        });

    } catch (error) {
        // T096: Rollback on any failure
        await transaction.rollback();
        console.error('Error converting quote to work order:', error);
        return res.status(500).json({
            success: false,
            message: 'Error converting quote to work order',
            error: error.message
        });
    }
};

// ============================================================================
// Messaging - Add and retrieve quote messages/comments
// ============================================================================

/**
 * Add a message/comment to a quote
 */
exports.addMessage = async (req, res) => {
    try {
        const { id: quoteId } = req.params;
        const { message, messageType = 'comment' } = req.body;
        const userId = req.userId;

        console.log('=== ADD QUOTE MESSAGE ===');
        console.log('Quote ID:', quoteId);
        console.log('User ID:', userId);
        console.log('Message Type:', messageType);

        // Validate message
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        // Verify quote exists
        const quote = await Quote.findByPk(quoteId);
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        // Check if quote is closed (no new messages allowed)
        const closedStatuses = ['Converted', 'Declined', 'Expired'];
        if (closedStatuses.includes(quote.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot add messages to a quote with status: ${quote.status}`
            });
        }

        // Verify user has access to this quote
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin';
        const isQuoteCreator = quote.created_by === userId;
        const isSameClient = quote.client_id === user.client_id;

        if (!isStaffOrAdmin && !isQuoteCreator && !isSameClient) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to comment on this quote'
            });
        }

        // Create the message
        const quoteMessage = await QuoteMessage.create({
            quote_id: quoteId,
            user_id: userId,
            message_type: messageType,
            message: message.trim(),
            created_at: new Date()
        });

        console.log('✓ Message created:', quoteMessage.id);

        // Fetch the created message with user info
        const createdMessage = await QuoteMessage.findByPk(quoteMessage.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'email', 'role']
            }]
        });

        return res.status(201).json({
            success: true,
            message: 'Message added successfully',
            data: {
                id: createdMessage.id,
                message: createdMessage.message,
                messageType: createdMessage.message_type,
                createdAt: createdMessage.created_at,
                user: {
                    id: createdMessage.user.id,
                    name: createdMessage.user.full_name,
                    email: createdMessage.user.email,
                    role: createdMessage.user.role
                }
            }
        });

    } catch (error) {
        console.error('Error adding message:', error);
        return res.status(500).json({
            success: false,
            message: 'Error adding message',
            error: error.message
        });
    }
};

/**
 * Get all messages for a quote
 */
exports.getMessages = async (req, res) => {
    try {
        const { id: quoteId } = req.params;

        console.log('=== GET QUOTE MESSAGES ===');
        console.log('Quote ID:', quoteId);

        // Verify quote exists
        const quote = await Quote.findByPk(quoteId);
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        // Get all messages with user information
        const messages = await QuoteMessage.findAll({
            where: { quote_id: quoteId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'email', 'role']
            }],
            order: [['created_at', 'ASC']]
        });

        console.log(`✓ Found ${messages.length} messages`);

        // Format messages
        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            message: msg.message,
            messageType: msg.message_type,
            createdAt: msg.created_at,
            previousCost: msg.previous_cost,
            newCost: msg.new_cost,
            previousHours: msg.previous_hours,
            newHours: msg.new_hours,
            user: msg.user ? {
                id: msg.user.id,
                name: msg.user.full_name,
                email: msg.user.email,
                role: msg.user.role
            } : null
        }));

        return res.status(200).json({
            success: true,
            count: formattedMessages.length,
            data: formattedMessages
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};

// ============================================================================
// T105-T109: Phase 10 - US2.3 - Staff Requests More Information
// ============================================================================

/**
 * Staff requests more information from client
 * PATCH /api/quotes/:id/request-info
 */
exports.requestInfo = async (req, res) => {
    try {
        const { id: quoteId } = req.params;
        const { message } = req.body;
        const userId = req.userId;

        console.log('=== REQUEST MORE INFO ===');
        console.log('Quote ID:', quoteId);
        console.log('User ID:', userId);

        // T106: Validate message field is required
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message is required when requesting more information'
            });
        }

        // Verify quote exists
        const quote = await Quote.findByPk(quoteId, {
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'full_name', 'email']
            }]
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        // Only allow requesting info on Submitted quotes
        if (quote.status !== 'Submitted') {
            return res.status(400).json({
                success: false,
                message: `Cannot request information on a quote with status: ${quote.status}. Only Submitted quotes can have information requested.`
            });
        }

        // T107: Change status to "Information Requested" and create QuoteMessage
        quote.status = 'Information Requested';
        await quote.save();

        // Create message with type 'info_requested'
        const quoteMessage = await QuoteMessage.create({
            quote_id: quoteId,
            user_id: userId,
            message_type: 'info_requested',
            message: message.trim(),
            created_at: new Date()
        });

        console.log('✓ Status changed to Information Requested');
        console.log('✓ Message created:', quoteMessage.id);

        // T109: Send notification to client (if notification service exists)
        try {
            const quoteNotificationService = require('../services/quoteNotificationService');
            if (quoteNotificationService && quoteNotificationService.notifyInfoRequested) {
                await quoteNotificationService.notifyInfoRequested(quote, message);
                console.log('✓ Notification sent to client');
            }
        } catch (notifError) {
            console.log('Note: Notification service not available or failed:', notifError.message);
            // Continue even if notification fails
        }

        return res.status(200).json({
            success: true,
            message: 'Information requested successfully',
            data: {
                quote: {
                    id: quote.id,
                    quote_number: quote.quote_number,
                    status: quote.status
                }
            }
        });

    } catch (error) {
        console.error('Error requesting information:', error);
        return res.status(500).json({
            success: false,
            message: 'Error requesting information',
            error: error.message
        });
    }
};

// Export all controller functions
module.exports = exports;
