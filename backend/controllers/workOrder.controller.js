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

// Update the getSummary function

exports.getSummary = async (req, res) => {
    try {
        // Count work orders by status
        const pending = await WorkOrder.count({ where: { status: 'pending' } });
        const inProgress = await WorkOrder.count({ where: { status: 'in-progress' } });
        const completed = await WorkOrder.count({ where: { status: 'completed' } });
        const cancelled = await WorkOrder.count({ where: { status: 'cancelled' } });
        const total = await WorkOrder.count();

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

        // Simple query first to check if it exists
        const workOrderExists = await WorkOrder.findByPk(id, {
            attributes: ['id']
        });

        if (!workOrderExists) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found'
            });
        }

        // Now fetch with minimal attributes first (avoid joins)
        const workOrder = await WorkOrder.findByPk(id);

        // Create a base response object with minimal data
        const formattedWorkOrder = {
            id: workOrder.id,
            jobNo: workOrder.job_no || '',
            status: workOrder.status || 'unknown',
            description: workOrder.description || '',
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

        // Try to fetch notes
        try {
            const notes = await WorkOrderNote.findAll({
                where: { work_order_id: id },
                attributes: ['id', 'note', 'created_by', 'createdAt']
            });

            formattedWorkOrder.notes = notes.map(note => ({
                id: note.id,
                content: note.note || '',
                createdById: note.created_by,
                createdAt: note.createdAt
            }));
        } catch (notesError) {
            console.error('Error fetching notes:', notesError);
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
        await StatusUpdate.create({
            work_order_id: id,
            previous_status: previousStatus,
            new_status: status,
            notes: notes || null,
            updated_by: req.userId
        });

        // Send successful response first
        const response = {
            success: true,
            message: req.userRole === 'client' ?
                'Cancellation request submitted successfully!' :
                'Work order status updated successfully!',
            data: { id: workOrder.id, status: workOrder.status }
        };

        res.status(200).json(response);

        // AFTER sending response, try to create notifications
        try {
            await notificationController.notifyStatusChange(id, previousStatus, status, req.userId);
        } catch (notificationError) {
            // Log the error but don't affect the main flow
            console.error('Error creating status change notification:', notificationError);
        }
    } catch (error) {
        console.error('Error updating work order status:', error);
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