const { Op } = require('sequelize');
const db = require('../models');
const notificationController = require('./notification.controller');
const smsService = require('../services/smsService');
const clientScoping = require('../middleware/clientScoping');
const WorkOrder = db.workOrder;
const StatusUpdate = db.statusUpdate;
const WorkOrderNote = db.workOrderNote;
const Photo = db.photo;
const User = db.user;
const AWS = require('aws-sdk');

// Configure AWS S3 client
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// Update the getSummary function

exports.getSummary = async (req, res) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole;
        const clientId = req.clientId;

        console.log('=== DASHBOARD SUMMARY DEBUG ===');
        console.log('User ID:', userId);
        console.log('User Role:', userRole);
        console.log('Client ID:', clientId);

        // Multi-tenant: Apply client scoping ONLY for client and client_admin roles
        // Staff and admin see all work orders across all clients UNLESS they explicitly filter by client
        let whereClause = {};

        if (['client', 'client_admin'].includes(userRole)) {
            whereClause = clientScoping.applyClientFilter(req);
        } else if (['staff', 'admin'].includes(userRole)) {
            // Staff and admin: Check if X-Client-Context header was provided
            // If yes, filter by that specific client
            if (req.isContextSwitched) {
                // Context was switched via X-Client-Context header - filter by that client
                whereClause.client_id = clientId;
                console.log('Staff/Admin filtering dashboard summary by client:', clientId);
            }
            // else: no client filter (see all work orders across all clients)
        }

        // Additional role-based filtering within the client
        if (userRole === 'client') {
            // Get the current user's email for filtering
            const user = await User.findByPk(userId);
            console.log('Found user:', user ? user.email : 'NOT FOUND');

            if (user) {
                // Filter work orders where authorized_email matches user's email
                whereClause.authorized_email = user.email;
                console.log(`Filtering dashboard summary for authorized email: ${user.email}`);
            } else {
                console.log('User not found, returning empty summary');
                whereClause.id = -1; // No work orders will match this
            }
        }
        // client_admin sees all work orders for their client
        // staff and admin see all work orders across all clients

        console.log('Dashboard summary whereClause:', JSON.stringify(whereClause));

        // Apply the whereClause to all count operations
        let pending = 0;
        let inProgress = 0;
        let completed = 0;
        let cancelled = 0;
        let total = 0;

        try {
            pending = await WorkOrder.count({
                where: { ...whereClause, status: 'pending' }
            });
        } catch (error) {
            console.error('Error counting pending work orders:', error);
        }

        try {
            inProgress = await WorkOrder.count({
                where: { ...whereClause, status: 'in-progress' }
            });
        } catch (error) {
            console.error('Error counting in-progress work orders:', error);
        }

        try {
            completed = await WorkOrder.count({
                where: { ...whereClause, status: 'completed' }
            });
        } catch (error) {
            console.error('Error counting completed work orders:', error);
        }

        try {
            cancelled = await WorkOrder.count({
                where: { ...whereClause, status: 'cancelled' }
            });
        } catch (error) {
            console.error('Error counting cancelled work orders:', error);
        }

        try {
            total = await WorkOrder.count({ where: whereClause });
        } catch (error) {
            console.error('Error counting total work orders:', error);
            // Calculate total from individual counts as fallback
            total = pending + inProgress + completed + cancelled;
        }

        console.log('Dashboard summary counts:', { pending, inProgress, completed, cancelled, total });

        return res.status(200).json({
            success: true,
            data: {
                pending,
                inProgress,
                completed,
                cancelled,
                total
            }
        });
    } catch (error) {
        console.error('Error fetching work order summary:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the work order summary.',
            error: error.message
        });
    }
};

// Get unique authorized persons for filtering
exports.getAuthorizedPersons = async (req, res) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole;
        const clientId = req.clientId; // This comes from clientScoping middleware (respects X-Client-Context)

        console.log('GET AUTHORIZED PERSONS - User:', userId, 'Role:', userRole, 'ClientId:', clientId);

        // Multi-tenant: Apply client scoping ONLY for client and client_admin roles
        // Staff and admin can filter by specific client via X-Client-Context header
        let whereClause = {};

        if (['client', 'client_admin'].includes(userRole)) {
            whereClause = clientScoping.applyClientFilter(req);
        } else if (['staff', 'admin'].includes(userRole)) {
            // Staff and admin: Check if X-Client-Context header was provided
            // If yes, req.clientId will be set by clientScoping middleware
            // If no X-Client-Context header, req.clientId will be their default client (show all)
            if (req.isContextSwitched) {
                // Context was switched via X-Client-Context header - filter by that client
                whereClause.client_id = clientId;
                console.log('Staff/Admin filtering authorized persons by client:', clientId);
            }
            // else: no client filter (see all authorized persons across all clients)
        }

        // Apply same role-based filtering as getAllWorkOrders for consistency
        if (userRole === 'client') {
            const user = await User.findByPk(userId);
            if (user) {
                whereClause.authorized_email = user.email;
            } else {
                whereClause.id = -1;
            }
        }

        console.log('Authorized persons where clause:', whereClause);

        const authorizedPersons = await WorkOrder.findAll({
            attributes: ['authorized_email'],
            where: {
                ...whereClause,
                authorized_email: { [Op.ne]: null } // Only get non-null authorized emails
            },
            group: ['authorized_email'],
            order: [['authorized_email', 'ASC']]
        });

        const uniquePersons = authorizedPersons
            .map(wo => wo.authorized_email)
            .filter(email => email && email.trim() !== ''); // Filter out empty emails

        console.log('Found', uniquePersons.length, 'authorized persons');

        return res.status(200).json({
            success: true,
            data: uniquePersons
        });

    } catch (error) {
        console.error('Error fetching authorized persons:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch authorized persons'
        });
    }
};

// Get all work orders with filtering
exports.getAllWorkOrders = async (req, res) => {
    try {
        const { status, date, sort, search, authorized_person, work_order_type, page = 1, limit = 5 } = req.query;
        const userId = req.userId;
        const userRole = req.userRole;
        const clientId = req.clientId;

        console.log(`GET WORK ORDERS - User: ${userId}, Role: ${userRole}, Client: ${clientId}`);

        // Multi-tenant: Apply client scoping ONLY for client and client_admin roles
        // Staff and admin see all work orders across all clients UNLESS they explicitly filter by client
        let whereClause = {};

        if (['client', 'client_admin'].includes(userRole)) {
            whereClause = clientScoping.applyClientFilter(req);
        } else if (['staff', 'admin'].includes(userRole)) {
            // Staff and admin: Check if X-Client-Context header was provided
            // If yes, filter by that specific client
            if (req.isContextSwitched) {
                // Context was switched via X-Client-Context header - filter by that client
                whereClause.client_id = clientId;
                console.log('Staff/Admin filtering work orders by client:', clientId);
            }
            // else: no client filter (see all work orders across all clients)
        }

        let includeClause = []; // Fix: this was missing

        // Apply role-based filtering based on email matching (within the client)
        if (userRole === 'client') {
            // Get the current user's email for filtering
            const user = await User.findByPk(userId);
            if (user) {
                // Filter work orders where authorized_email matches user's email
                whereClause.authorized_email = user.email;
                console.log(`Filtering work orders for authorized email: ${user.email}`);
            } else {
                console.log('User not found, returning empty results');
                whereClause.id = -1; // No work orders will match this
            }
        }
        // client_admin sees all work orders for their client
        // staff and admin see all work orders across all clients

        console.log('Where clause:', JSON.stringify(whereClause));

        // Apply other filters (status, date, search)
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        if (date === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            whereClause.date = {
                [Op.gte]: today,
                [Op.lt]: tomorrow
            };
        }

        if (search) {
            whereClause[Op.or] = [
                { job_no: { [Op.iLike]: `%${search}%` } },
                { property_name: { [Op.iLike]: `%${search}%` } },
                { property_address: { [Op.iLike]: `%${search}%` } }, // Include address in search
                { description: { [Op.iLike]: `%${search}%` } },
                { work_description: { [Op.iLike]: `%${search}%` } } // Include work description in search
            ];
        }

        // Filter by authorized person
        if (authorized_person && authorized_person !== 'all') {
            whereClause.authorized_email = authorized_person;
        }

        // Filter by work order type
        if (work_order_type && work_order_type !== 'all') {
            whereClause.work_order_type = work_order_type;
        }

        const offset = (page - 1) * limit;
        let orderClause = [['createdAt', 'DESC']];

        if (sort === 'latest') {
            orderClause = [['createdAt', 'DESC']];
        }

        console.log('Where clause:', JSON.stringify(whereClause));

        const workOrders = await WorkOrder.findAndCountAll({
            where: whereClause,
            include: [
                ...includeClause,
                {
                    model: Photo,
                    as: 'photos',
                    attributes: ['id'], // Only get the id to count photos, not full data
                    required: false
                }
            ],
            order: orderClause,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        console.log(`Found ${workOrders.count} work orders`);
        console.log('Sample work order with photos:', JSON.stringify(workOrders.rows[0], null, 2));

        // Format the response
        const formattedWorkOrders = workOrders.rows.map(workOrder => {
            const photoCount = workOrder.photos ? workOrder.photos.length : 0;
            console.log(`Work Order ${workOrder.id} photo count: ${photoCount}`, workOrder.photos);

            return {
                id: workOrder.id,
                jobNo: workOrder.job_no,
                job_no: workOrder.job_no, // Include both formats for compatibility
                date: workOrder.date ? formatDate(workOrder.date) : 'N/A',
                status: workOrder.status,
                work_order_type: workOrder.work_order_type, // Include work order type
                client_id: workOrder.client_id, // Multi-tenant: Include client_id
                supplierName: workOrder.supplier_name,
                supplier_name: workOrder.supplier_name, // Include both formats
                propertyName: workOrder.property_name,
                propertyAddress: workOrder.property_address, // Fix: Use actual property_address field
                property_name: workOrder.property_name, // Include both formats
                property_address: workOrder.property_address,
                description: workOrder.description,
                workDescription: workOrder.description,
                work_description: workOrder.description, // Include both formats
                poNumber: workOrder.po_number,
                photoCount: photoCount, // Add photo count
                photos: workOrder.photos || [] // Include photos array for debugging
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedWorkOrders,
            pagination: {
                total: workOrders.count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(workOrders.count / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching work orders:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching work orders.',
            error: error.message
        });
    }
};

// Modified getWorkOrderById function to fix the error
exports.getWorkOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;
        console.log(`Fetching work order with ID: ${id}, Client ID: ${clientId}`);

        // Multi-tenant: Fetch work order and validate client ownership
        const workOrder = await WorkOrder.findByPk(id);

        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found'
            });
        }

        // Validate client ownership (skip for staff and admin roles)
        const userRole = req.userRole;
        if (!['staff', 'admin'].includes(userRole)) {
            try {
                clientScoping.validateClientOwnership(workOrder, clientId);
            } catch (error) {
                return res.status(error.statusCode || 403).json({
                    success: false,
                    message: error.message
                });
            }
        }

        // Create a base response object with minimal data
        const formattedWorkOrder = {
            id: workOrder.id,
            jobNo: workOrder.job_no || '',
            status: workOrder.status || 'unknown',
            description: workOrder.description || '',
            client_id: workOrder.client_id, // Multi-tenant: Include client_id
            createdAt: workOrder.createdAt,
            updatedAt: workOrder.updatedAt,

            // Initialize empty arrays for related data
            photos: [],
            notes: [],
            statusUpdates: []
        };

        // Only if basic data works, try to add more fields with safe defaults
        try {
            formattedWorkOrder.date = workOrder.date ? formatDate(workOrder.date) : '';
            formattedWorkOrder.supplier = {
                name: workOrder.supplier_name || '',
                phone: workOrder.supplier_phone || '',
                email: workOrder.supplier_email || ''
            };
            formattedWorkOrder.property = {
                name: workOrder.property_name || '',
                address: workOrder.property_address || '',
                phone: workOrder.property_phone || ''
            };
            formattedWorkOrder.poNumber = workOrder.po_number || '';
        } catch (basicDataError) {
            console.error('Error formatting basic work order data:', basicDataError);
            // Continue anyway with what we have
        }

        // Try to add authorized by info
        try {
            formattedWorkOrder.authorizedBy = workOrder.authorized_by ? {
                name: workOrder.authorized_by || '',
                contact: workOrder.authorized_contact || '',
                email: workOrder.authorized_email || ''
            } : null;
        } catch (authError) {
            console.error('Error adding authorized by info:', authError);
            formattedWorkOrder.authorizedBy = null;
        }

        // Add creator info if available
        try {
            if (workOrder.created_by) {
                const creator = await User.findByPk(workOrder.created_by, {
                    attributes: ['id', 'full_name', 'email']
                });
                if (creator) {
                    formattedWorkOrder.creator = {
                        id: creator.id,
                        name: creator.full_name || '',
                        email: creator.email || ''
                    };
                }
            }
        } catch (creatorError) {
            console.error('Error fetching creator:', creatorError);
            formattedWorkOrder.creator = null;
        }

        // Try to fetch photos
        try {
            const photos = await Photo.findAll({
                where: { work_order_id: id }
            });

            formattedWorkOrder.photos = photos.map(photo => {
                try {
                    return {
                        id: photo.id,
                        url: photo.file_path || '',
                        filename: photo.file_name || '',
                        description: photo.description || '',
                        uploadedAt: photo.createdAt
                    };
                } catch (photoMapError) {
                    console.error('Error mapping photo:', photoMapError);
                    return { id: photo.id, error: true };
                }
            }).filter(p => p !== null);
        } catch (photoError) {
            console.error('Error fetching photos:', photoError);
        }

        // Try to fetch notes with improved debugging and error handling
        try {
            console.log(`Fetching notes for work order ${id}`);

            // Verify the model is available
            if (!WorkOrderNote) {
                console.error('WorkOrderNote model is not defined!');
                formattedWorkOrder.notesLoadError = 'Model definition error';
                throw new Error('WorkOrderNote model not found');
            }

            // Log the table name and key info for debugging
            console.log('Using model:', WorkOrderNote.tableName || 'unknown table name');

            // Try to get the count first - if this fails, it's likely a model/DB issue
            const noteCount = await WorkOrderNote.count({ where: { work_order_id: id } });
            console.log(`Found ${noteCount} notes for work order ${id}`);

            // Fetch the notes with creator information to provide more complete data
            const notes = await WorkOrderNote.findAll({
                where: { work_order_id: id },
                attributes: ['id', 'note', 'created_by', 'createdAt'],
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'email'],
                    required: false
                }],
                order: [['createdAt', 'DESC']] // Most recent notes first
            });

            console.log(`Successfully retrieved ${notes.length} notes`);

            // Enhanced mapping with more complete information
            formattedWorkOrder.notes = notes.map(note => {
                const creator = note.creator ? {
                    id: note.creator.id,
                    name: note.creator.full_name || 'Unknown',
                    email: note.creator.email || ''
                } : null;

                return {
                    id: note.id,
                    content: note.note || '',
                    createdById: note.created_by,
                    createdAt: note.createdAt,
                    creator: creator
                };
            });
        } catch (notesError) {
            console.error('Error fetching notes:', notesError);
            formattedWorkOrder.notes = [];
            formattedWorkOrder.notesError = notesError.message || 'Unknown error fetching notes';
        }

        // Try to fetch status updates
        try {
            const statusUpdates = await StatusUpdate.findAll({
                where: { work_order_id: id },
                attributes: ['id', 'previous_status', 'new_status', 'notes', 'updated_by', 'createdAt']
            });

            formattedWorkOrder.statusUpdates = statusUpdates.map(update => ({
                id: update.id,
                previousStatus: update.previous_status || '',
                newStatus: update.new_status || '',
                notes: update.notes || '',
                updatedById: update.updated_by,
                updatedAt: update.createdAt
            }));
        } catch (statusError) {
            console.error('Error fetching status updates:', statusError);
        }

        return res.status(200).json({
            success: true,
            data: formattedWorkOrder
        });
    } catch (error) {
        console.error('Error fetching work order details:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching work order details.',
            error: error.message
        });
    }
};

// Create a new work order
exports.createWorkOrder = async (req, res) => {
    try {
        const {
            job_no,
            date,
            status,
            supplier_name,
            supplier_phone,
            supplier_email,
            property_name,
            property_address,
            property_phone,
            description,
            po_number,
            authorized_by,
            authorized_contact,
            authorized_email
        } = req.body;

        // Validate required fields
        if (!job_no || !supplier_name || !property_name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields. Please provide job number, supplier name, property name, and description.'
            });
        }

        // Check if work order with the same job number already exists
        const existingWorkOrder = await WorkOrder.findOne({ where: { job_no } });
        if (existingWorkOrder) {
            return res.status(400).json({
                success: false,
                message: 'A work order with this job number already exists.'
            });
        }

        // Create new work order
        const workOrder = await WorkOrder.create({
            job_no,
            date: date || new Date(),
            status: status || 'pending',
            supplier_name,
            supplier_phone,
            supplier_email,
            property_name,
            property_address,
            property_phone,
            description,
            po_number,
            authorized_by,
            authorized_contact,
            authorized_email,
            created_by: req.userId, // From auth middleware
            client_id: req.clientId // Multi-tenant: Automatically assign client_id
        });

        // Create notification for new work order
        await notificationController.createNotification(
            req.userId,
            workOrder.id,
            'work-order',
            'New Work Order Created',
            `New work order created: Job #${workOrder.job_no}`
        );

        return res.status(201).json({
            success: true,
            message: 'Work order created successfully!',
            data: {
                id: workOrder.id,
                jobNo: workOrder.job_no,
                status: workOrder.status
            }
        });
    } catch (error) {
        console.error('Error creating work order:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the work order.'
        });
    }
};

// Update work order status
exports.updateWorkOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Validate status
        if (!status || !['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Status must be one of: pending, in-progress, completed, cancelled.'
            });
        }

        // Add special handling for client cancellation requests
        if (req.userRole === 'client' && status !== 'cancelled') {
            return res.status(403).json({
                success: false,
                message: 'Clients can only request cancellation of work orders.'
            });
        }

        // Check if notes are required for client cancellations
        if (req.userRole === 'client' && status === 'cancelled' && (!notes || !notes.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for the cancellation request.'
            });
        }

        // Find the work order
        const workOrder = await WorkOrder.findByPk(id);
        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found.'
            });
        }

        // Record previous status
        const previousStatus = workOrder.status;

        // If status is the same, just return success
        if (previousStatus === status && !notes) {
            return res.status(200).json({
                success: true,
                message: 'No changes were made to the work order.',
                data: { id: workOrder.id, status: workOrder.status }
            });
        }

        // Update the work order status
        await workOrder.update({ status });

        // Create status update record
        try {
            await StatusUpdate.create({
                work_order_id: id,
                previous_status: previousStatus,
                new_status: status,
                notes: notes || null,
                updated_by: req.userId
            });
        } catch (statusError) {
            console.error('Error creating status update:', statusError);
        }

        // Send response first
        const response = {
            success: true,
            message: req.userRole === 'client' ?
                'Cancellation request submitted successfully!' :
                'Work order status updated successfully!',
            data: { id: workOrder.id, status: workOrder.status }
        };

        res.status(200).json(response);

        // AFTER response, try SMS webhook (asynchronously)
        setImmediate(async () => {
            try {
                console.log('🚀 Attempting SMS webhook for status change:', {
                    jobNo: workOrder.job_no,
                    oldStatus: previousStatus,
                    newStatus: status
                });

                const smsResult = await smsService.sendWorkOrderStatusSMS(
                    workOrder,
                    previousStatus,
                    status,
                    req.userRole
                );

                if (smsResult.success) {
                    console.log(`✅ SMS webhook sent for work order ${workOrder.job_no}`);
                } else {
                    console.log(`⚠️ SMS webhook failed for work order ${workOrder.job_no}:`, smsResult.reason || smsResult.error);
                }

            } catch (smsError) {
                console.error('❌ Error in SMS webhook:', smsError);
            }
        });

        // Try notifications (also asynchronously)
        setImmediate(async () => {
            try {
                const notificationController = require('./notification.controller');
                if (notificationController && notificationController.notifyStatusChange) {
                    await notificationController.notifyStatusChange(id, previousStatus, status, req.userId);
                    console.log('✅ In-app notification created');
                }
            } catch (notificationError) {
                console.error('Error creating notification:', notificationError);
            }
        });

    } catch (error) {
        console.error('❌ Error updating work order status:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating the work order status.',
            error: error.message
        });
    }
};

// Add note to work order
exports.addWorkOrderNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        // Validate note
        if (!note) {
            return res.status(400).json({
                success: false,
                message: 'Note content is required.'
            });
        }

        // Check if work order exists
        const workOrder = await WorkOrder.findByPk(id);

        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found.'
            });
        }

        // Create note
        const workOrderNote = await WorkOrderNote.create({
            work_order_id: id,
            note,
            created_by: req.userId // From auth middleware
        });

        // Get user info
        const user = await User.findByPk(req.userId);

        // Create notification
        await notificationController.notifyNewNote(id, note, req.userId);

        return res.status(201).json({
            success: true,
            message: 'Note added successfully!',
            data: {
                id: workOrderNote.id,
                note: workOrderNote.note,
                createdBy: user ? user.full_name : 'Unknown',
                createdAt: workOrderNote.createdAt
            }
        });
    } catch (error) {
        console.error('Error adding work order note:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while adding the note.'
        });
    }
};

// Delete work order
exports.deleteWorkOrder = async (req, res) => {
    try {
        const { id } = req.params; // Changed from workOrderId to id
        const clientId = req.clientId;

        // Check if work order exists
        const workOrder = await WorkOrder.findByPk(id);
        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found'
            });
        }

        // Multi-tenant: Validate client ownership before allowing deletion (skip for staff/admin)
        const userRole = req.userRole;
        if (!['staff', 'admin'].includes(userRole)) {
            try {
                clientScoping.validateClientOwnership(workOrder, clientId);
            } catch (error) {
                return res.status(error.statusCode || 403).json({
                    success: false,
                    message: error.message
                });
            }
        }

        // Create notification before deletion
        await notificationController.createNotification(
            req.userId,
            id,
            'work-order',
            'Work Order Deleted',
            `Work order Job #${workOrder.job_no} has been deleted`
        );

        // Start transaction
        const t = await db.sequelize.transaction();

        try {
            // Delete photos from S3 and database
            if (db.photo) {
                const photos = await Photo.findAll({
                    where: { work_order_id: id }
                });

                // Delete photos from S3
                if (photos.length > 0 && process.env.AWS_S3_BUCKET) {
                    for (const photo of photos) {
                        try {
                            const url = new URL(photo.file_path);
                            const key = url.pathname.substring(1);

                            await s3.deleteObject({
                                Bucket: process.env.AWS_S3_BUCKET,
                                Key: key
                            }).promise();
                        } catch (error) {
                            console.warn(`Failed to delete S3 file for photo: ${photo.id}`, error);
                        }
                    }
                }

                // Delete photos from database
                await Photo.destroy({
                    where: { work_order_id: id },
                    transaction: t
                });
            }

            // Delete work order notes
            if (db.workOrderNote) {
                await WorkOrderNote.destroy({
                    where: { work_order_id: id },
                    transaction: t
                });
            }

            // Delete status updates
            if (db.statusUpdate) {
                await StatusUpdate.destroy({
                    where: { work_order_id: id },
                    transaction: t
                });
            }

            // Delete notifications
            if (db.notification) {
                await db.notification.destroy({
                    where: { work_order_id: id },
                    transaction: t
                });
            }

            // Finally delete the work order
            await workOrder.destroy({ transaction: t });

            // Commit transaction
            await t.commit();

            return res.status(200).json({
                success: true,
                message: 'Work order and all related data deleted successfully'
            });

        } catch (error) {
            // Rollback transaction on error
            await t.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error deleting work order:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the work order',
            error: error.message
        });
    }
};

// Update work order (full update)
exports.updateWorkOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;
        const {
            job_no,
            date,
            status,
            supplier_name,
            supplier_phone,
            supplier_email,
            property_name,
            property_address,
            property_phone,
            description,
            po_number,
            authorized_by,
            authorized_contact,
            authorized_email
        } = req.body;

        // Find the work order to update
        const workOrder = await WorkOrder.findByPk(id);
        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found.'
            });
        }

        // Multi-tenant: Validate client ownership before allowing updates (skip for staff/admin)
        const userRole = req.userRole;
        if (!['staff', 'admin'].includes(userRole)) {
            try {
                clientScoping.validateClientOwnership(workOrder, clientId);
            } catch (error) {
                return res.status(error.statusCode || 403).json({
                    success: false,
                    message: error.message
                });
            }
        }

        // Check if job_no is being changed and if the new job_no already exists
        if (job_no && job_no !== workOrder.job_no) {
            const existingWorkOrder = await WorkOrder.findOne({ where: { job_no } });
            if (existingWorkOrder) {
                return res.status(400).json({
                    success: false,
                    message: 'A work order with this job number already exists.'
                });
            }
        }

        // Update work order fields
        await workOrder.update({
            job_no: job_no || workOrder.job_no,
            date: date || workOrder.date,
            status: status || workOrder.status,
            supplier_name: supplier_name || workOrder.supplier_name,
            supplier_phone: supplier_phone || workOrder.supplier_phone,
            supplier_email: supplier_email || workOrder.supplier_email,
            property_name: property_name || workOrder.property_name,
            property_address: property_address || workOrder.property_address,
            property_phone: property_phone || workOrder.property_phone,
            description: description || workOrder.description,
            po_number: po_number || workOrder.po_number,
            authorized_by: authorized_by || workOrder.authorized_by,
            authorized_contact: authorized_contact || workOrder.authorized_contact,
            authorized_email: authorized_email || workOrder.authorized_email,
            updated_by: req.userId
        });

        return res.status(200).json({
            success: true,
            message: 'Work order updated successfully!',
            data: {
                id: workOrder.id,
                jobNo: workOrder.job_no,
                status: workOrder.status
            }
        });
    } catch (error) {
        console.error('Error updating work order:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating the work order.',
            error: error.message
        });
    }
};

// Helper function to format dates
function formatDate(date) {
    if (!date) return '';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
}

// Add this function to your controller

// Get notes for a specific work order
exports.getWorkOrderNotes = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching notes for work order ID: ${id}`);

        // Validate work order ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid work order ID'
            });
        }

        // Ensure the work order exists
        const workOrderExists = await WorkOrder.findByPk(id, {
            attributes: ['id']
        });

        if (!workOrderExists) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found'
            });
        }

        // Get the correct model reference
        const NoteModel = db.workOrderNote;

        if (!NoteModel) {
            throw new Error('WorkOrderNote model not properly registered in db object');
        }

        // Debug table and column names
        console.log('Table name:', NoteModel.tableName);
        console.log('Available attributes:', Object.keys(NoteModel.rawAttributes));

        // Log names to help with debugging
        console.log('Using Sequelize timestamp mappings:');
        console.log('- JavaScript property:', 'createdAt');
        console.log('- Database column:', NoteModel.rawAttributes.created_at ? 'created_at' : '<not found>');

        // IMPORTANT: Use camelCase (JavaScript property name) in Sequelize queries
        const notes = await NoteModel.findAll({
            where: { work_order_id: id },
            order: [['createdAt', 'DESC']], // Use JavaScript property name
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'full_name', 'email'],
                required: false
            }]
        });

        console.log(`Found ${notes.length} notes for work order ${id}`);

        // Format the response using the JavaScript attribute names (camelCase)
        const formattedNotes = notes.map(note => ({
            id: note.id,
            content: note.note || '',
            createdById: note.created_by,
            createdAt: note.createdAt, // Use the JavaScript property
            creator: note.creator ? {
                id: note.creator.id,
                name: note.creator.full_name || 'Unknown',
                email: note.creator.email || ''
            } : null
        }));

        return res.status(200).json({
            success: true,
            data: formattedNotes
        });
    } catch (error) {
        console.error('Error fetching work order notes:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching notes.',
            error: error.message
        });
    }
};

// Create manual work order (for client_admin users only)
exports.createManualWorkOrder = async (req, res) => {
    try {
        const {
            job_no,
            date,
            supplier_name,
            supplier_phone,
            supplier_email,
            property_name,
            property_address,
            property_phone,
            description,
            po_number,
            authorized_by,
            authorized_contact,
            authorized_email
        } = req.body;

        console.log('Creating manual work order:', { job_no, property_name, property_address, property_phone });

        // Validate required fields (updated per new spec)
        if (!job_no || !property_name || !property_address || !property_phone || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields. Please provide job number, property name, property address, property phone, and description.'
            });
        }

        // Validate email format if provided
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (supplier_email && !emailRegex.test(supplier_email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format for supplier_email.'
            });
        }
        if (authorized_email && !emailRegex.test(authorized_email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format for authorized_email.'
            });
        }

        // Check for duplicate job number
        const existingWorkOrder = await WorkOrder.findOne({ where: { job_no } });
        if (existingWorkOrder) {
            return res.status(400).json({
                success: false,
                message: `Work order with job number ${job_no} already exists.`
            });
        }

        // Fetch logged-in user's details to auto-fill authorized by fields
        const user = await User.findByPk(req.userId, {
            attributes: ['full_name', 'email', 'phone_number']
        });

        // Auto-fill authorized by details from logged-in user
        const authorizedByName = authorized_by || (user ? user.full_name : '');
        const authorizedContactPhone = authorized_contact || (user ? user.phone_number : '');
        const authorizedEmailAddress = authorized_email || (user ? user.email : '');

        // ALWAYS use Williams Property Service as the supplier (per spec requirement)
        // Ignore any supplier details sent from frontend - always enforce default
        const defaultSupplierName = 'Williams Property Service';
        const defaultSupplierPhone = '021 123 4567';
        const defaultSupplierEmail = 'info@williamspropertyservices.co.nz';

        // Create work order with work_order_type='manual'
        const workOrder = await WorkOrder.create({
            job_no,
            date: date || new Date(),
            status: 'pending',
            work_order_type: 'manual',
            supplier_name: defaultSupplierName, // ALWAYS Williams Property Service
            supplier_phone: defaultSupplierPhone, // ALWAYS 021 123 4567
            supplier_email: defaultSupplierEmail, // ALWAYS info@williamspropertyservices.co.nz
            property_name,
            property_address,
            property_phone,
            description,
            po_number,
            authorized_by: authorizedByName,
            authorized_contact: authorizedContactPhone,
            authorized_email: authorizedEmailAddress,
            created_by: req.userId, // From auth middleware
            client_id: req.clientId // Multi-tenant: Automatically assign client_id
        });

        console.log('Manual work order created:', workOrder.id);

        // Get creator info for email notification
        const creator = await User.findByPk(req.userId, {
            attributes: ['id', 'full_name', 'email']
        });

        // Send in-app notifications (reuse existing notification helper)
        try {
            await notificationController.createNotification(
                req.userId,
                workOrder.id,
                'work-order',
                'New Work Order Created (Manual)',
                `New manual work order created: Job #${workOrder.job_no} by ${creator ? creator.full_name : 'Unknown'}`
            );
            console.log('✅ In-app notification created for manual work order');
        } catch (notificationError) {
            console.error('Error creating in-app notification:', notificationError);
            // Don't block work order creation if notification fails
        }

        // Send email notification asynchronously (non-blocking)
        setImmediate(async () => {
            try {
                const emailService = require('../utils/emailService');
                await emailService.sendWorkOrderCreatedEmail(workOrder, creator || { full_name: 'Unknown', email: 'unknown@example.com' });
                console.log('✅ Email notification sent for manual work order');
            } catch (emailError) {
                console.error('❌ Failed to send email notification:', emailError);
                // Email failure doesn't block work order creation
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Work order created successfully',
            data: {
                id: workOrder.id,
                job_no: workOrder.job_no,
                status: workOrder.status,
                work_order_type: workOrder.work_order_type,
                created_by: workOrder.created_by,
                createdAt: workOrder.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating manual work order:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the work order.',
            error: error.message
        });
    }
};