const db = require('../models');
const notificationController = require('./notification.controller');
const WorkOrder = db.workOrder;
const StatusUpdate = db.statusUpdate;
const WorkOrderNote = db.workOrderNote;
const Photo = db.photo;
const User = db.user;
const { Op } = db.Sequelize;
const AWS = require('aws-sdk');

// Configure AWS S3 client
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// Get work order summary for dashboard
exports.getSummary = async (req, res) => {
    try {
        // Count work orders by status
        const pending = await WorkOrder.count({ where: { status: 'pending' } });
        const inProgress = await WorkOrder.count({ where: { status: 'in-progress' } });
        const completed = await WorkOrder.count({ where: { status: 'completed' } });
        const total = await WorkOrder.count();

        return res.status(200).json({
            success: true,
            data: {
                pending,
                inProgress,
                completed,
                total
            }
        });
    } catch (error) {
        console.error('Error fetching work order summary:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the work order summary.'
        });
    }
};

// Get all work orders with filtering
exports.getAllWorkOrders = async (req, res) => {
    try {
        const { status, date, sort, search } = req.query;
        const whereClause = {};
        const orderClause = [];

        // Apply status filter
        if (status && ['pending', 'in-progress', 'completed'].includes(status)) {
            whereClause.status = status;
        }

        // Apply date filter
        // if (date === 'today') {
        //     const today = new Date();
        //     today.setHours(0, 0, 0, 0);
        //     whereClause.date = {
        //         [Op.gte]: today
        //     };
        // }

        // Apply sort
        if (sort === 'latest') {
            orderClause.push(['createdAt', 'DESC']);
        } else {
            orderClause.push(['date', 'DESC']);
        }

        // Apply search
        if (search) {
            whereClause[Op.or] = [
                { job_no: { [Op.iLike]: `%${search}%` } },
                { property_name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Get work orders with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const workOrders = await WorkOrder.findAndCountAll({
            where: whereClause,
            order: orderClause,
            limit,
            offset,
            attributes: ['id', 'job_no', 'date', 'status', 'property_name', 'description', 'authorized_by', 'createdAt']
        });

        // Format the response data
        const formattedWorkOrders = workOrders.rows.map(wo => {
            return {
                id: wo.id,
                jobNo: wo.job_no,
                date: formatDate(wo.date),
                status: wo.status,
                property: wo.property_name,
                description: wo.description,
                authorizedBy: wo.authorized_by
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedWorkOrders,
            pagination: {
                total: workOrders.count,
                page,
                limit,
                pages: Math.ceil(workOrders.count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching work orders:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching work orders.'
        });
    }
};

// Modified getWorkOrderById function to fix the error
exports.getWorkOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching work order with ID: ${id}`);

        // Find the work order first
        const workOrder = await WorkOrder.findByPk(id);

        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found'
            });
        }

        // Then fetch related data separately with error handling
        let photos = [];
        let notes = [];
        let statusUpdates = [];
        let creator = null;

        try {
            // Fetch photos
            photos = await Photo.findAll({
                where: { work_order_id: id },
                include: [{
                    model: User,
                    as: 'uploader',
                    attributes: ['id', 'full_name', 'email']
                }]
            });
        } catch (photoError) {
            console.error('Error fetching photos:', photoError);
            photos = []; // Fail gracefully
        }

        try {
            // Fetch notes
            notes = await WorkOrderNote.findAll({
                where: { work_order_id: id },
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'email']
                }]
            });
        } catch (notesError) {
            console.error('Error fetching notes:', notesError);
            notes = []; // Fail gracefully
        }

        try {
            // Fetch status updates
            statusUpdates = await StatusUpdate.findAll({
                where: { work_order_id: id },
                include: [{
                    model: User,
                    as: 'updater',
                    attributes: ['id', 'full_name', 'email']
                }]
            });
        } catch (statusError) {
            console.error('Error fetching status updates:', statusError);
            statusUpdates = []; // Fail gracefully
        }

        // Fetch creator user
        if (workOrder.created_by) {
            try {
                creator = await User.findByPk(workOrder.created_by, {
                    attributes: ['id', 'full_name', 'email']
                });
            } catch (creatorError) {
                console.error('Error fetching creator:', creatorError);
                // Fail gracefully
            }
        }

        // Format the response
        const formattedWorkOrder = {
            id: workOrder.id,
            jobNo: workOrder.job_no,
            date: formatDate(workOrder.date),
            status: workOrder.status,
            supplier: {
                name: workOrder.supplier_name,
                phone: workOrder.supplier_phone || null,
                email: workOrder.supplier_email || null
            },
            property: {
                name: workOrder.property_name,
                phone: workOrder.property_phone || null
            },
            description: workOrder.description,
            poNumber: workOrder.po_number,
            authorizedBy: workOrder.authorized_by ? {
                name: workOrder.authorized_by,
                contact: workOrder.authorized_contact || null,
                email: workOrder.authorized_email || null
            } : null,
            creator: creator ? {
                id: creator.id,
                name: creator.full_name,
                email: creator.email
            } : null,
            photos: photos.map(photo => ({
                id: photo.id,
                url: photo.file_path,
                filename: photo.file_name,
                description: photo.description || null,
                uploadedAt: photo.createdAt,
                uploadedBy: photo.uploader ? {
                    id: photo.uploader.id,
                    name: photo.uploader.full_name,
                    email: photo.uploader.email
                } : null
            })),
            notes: notes.map(note => ({
                id: note.id,
                content: note.note,
                createdBy: note.creator ? {
                    id: note.creator.id,
                    name: note.creator.full_name,
                    email: note.creator.email
                } : null,
                createdAt: note.createdAt
            })),
            statusUpdates: statusUpdates.map(update => ({
                id: update.id,
                previousStatus: update.previous_status,
                newStatus: update.new_status,
                notes: update.notes,
                updatedBy: update.updater ? {
                    id: update.updater.id,
                    name: update.updater.full_name,
                    email: update.updater.email
                } : null,
                updatedAt: update.createdAt
            })),
            createdAt: workOrder.createdAt,
            updatedAt: workOrder.updatedAt
        };

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
            property_phone,
            description,
            po_number,
            authorized_by,
            authorized_contact,
            authorized_email,
            created_by: req.userId // From auth middleware
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
        // Check if user is client - this is a redundant safeguard
        if (req.userRole === 'client') {
            return res.status(403).json({
                success: false,
                message: 'Clients are not authorized to update work order status.'
            });
        }

        const { id } = req.params;
        const { status, notes } = req.body;

        // Validate status
        if (!status || !['pending', 'in-progress', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Status must be one of: pending, in-progress, completed.'
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
        await StatusUpdate.create({
            work_order_id: id,
            previous_status: previousStatus,
            new_status: status,
            notes: notes || null,
            updated_by: req.userId
        });

        // Create notification - make sure to notify current user and clients
        await notificationController.notifyStatusChange(id, previousStatus, status, req.userId);

        return res.status(200).json({
            success: true,
            message: 'Work order status updated successfully!',
            data: { id: workOrder.id, status: workOrder.status }
        });
    } catch (error) {
        console.error('Error updating work order status:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating the work order status.'
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
        const { workOrderId } = req.params;

        // Check if work order exists
        const workOrder = await WorkOrder.findByPk(workOrderId);
        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found'
            });
        }

        // Create notification before deletion
        await notificationController.createNotification(
            req.userId,
            workOrderId,
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
                    where: { work_order_id: workOrderId }
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
                    where: { work_order_id: workOrderId },
                    transaction: t
                });
            }

            // Delete work order notes
            if (db.workOrderNote) {
                await WorkOrderNote.destroy({
                    where: { work_order_id: workOrderId },
                    transaction: t
                });
            }

            // Delete status updates
            if (db.statusUpdate) {
                await StatusUpdate.destroy({
                    where: { work_order_id: workOrderId },
                    transaction: t
                });
            }

            // Delete notifications
            if (db.notification) {
                await db.notification.destroy({
                    where: { work_order_id: workOrderId },
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

// Helper function to format dates
function formatDate(date) {
    if (!date) return '';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
}