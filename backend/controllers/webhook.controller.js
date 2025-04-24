// controllers/webhook.controller.js
const db = require('../models');
const WorkOrder = db.workOrder;
const Notification = db.notification;
const User = db.user;
const Note = db.note;
const Alert = db.alert;
const notificationController = require('./notification.controller');
const WorkOrderNote = db.workOrderNote;

// Create work order from n8n email processing
exports.createWorkOrderFromEmail = async (req, res) => {
    try {
        // Extract data sent by n8n
        const {
            job_no,
            date,
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
            email_subject,
            email_sender,
            email_received_date,
            attachment_data
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

        // Find admin user to set as creator
        const adminUser = await User.findOne({ where: { role: 'admin' } });
        if (!adminUser) {
            return res.status(500).json({
                success: false,
                message: 'No admin user found to assign as creator.'
            });
        }

        // Create new work order
        const workOrder = await WorkOrder.create({
            job_no,
            date: date || new Date(),
            status: 'pending',
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
            created_by: adminUser.id,
            // Optional metadata from email
            work_order_type: 'email', // Mark as coming from email
            metadata: {
                email_subject,
                email_sender,
                email_received_date,
                created_via: 'n8n_workflow'
            }
        });

        // Notify relevant staff about the new work order
        await notifyUsersAboutWorkOrder(workOrder.id, adminUser.id);

        return res.status(201).json({
            success: true,
            message: 'Work order created successfully from email!',
            data: {
                id: workOrder.id,
                jobNo: workOrder.job_no,
                status: workOrder.status
            }
        });
    } catch (error) {
        console.error('Error creating work order from email:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the work order from email.',
            error: error.message
        });
    }
};

// Create notifications for relevant users
async function notifyUsersAboutWorkOrder(workOrderId, createdById) {
    try {
        // Find all staff and admin users
        const staffUsers = await User.findAll({
            where: {
                role: ['staff', 'admin'],
                is_active: true
            }
        });

        // Find all client users
        const clientUsers = await User.findAll({
            where: {
                role: 'client',
                is_active: true
            }
        });

        // Create notifications for staff users
        for (const user of staffUsers) {
            await notificationController.createNotification(
                user.id,
                workOrderId,
                'work-order',
                'New Work Order Created',
                `A new work order has been automatically created from an email.`,
            );
        }

        // Create notifications for client users
        for (const user of clientUsers) {
            await notificationController.createNotification(
                user.id,
                workOrderId,
                'work-order',
                'New Work Order Created',
                `A new work order has been submitted and is awaiting processing.`,
            );
        }
    } catch (error) {
        console.error('Error creating notifications:', error);
    }
}

// Webhook verification endpoint that n8n can use to check if the API is online
exports.verifyWebhook = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Webhook endpoint is active',
        timestamp: new Date().toISOString()
    });
};

exports.addNoteToWorkOrder = async (req, res) => {
    try {
        // Add debug logging
        console.log('Received webhook request:', {
            body: req.body,
            models: {
                hasWorkOrder: !!db.workOrder,
                hasWorkOrderNote: !!db.workOrderNote,
                hasNotification: !!db.notification
            }
        });

        const { job_no, note_content } = req.body;

        // Validate required fields
        if (!job_no || !note_content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields. Please provide job number and note content.'
            });
        }

        // Find the work order
        const workOrder = await WorkOrder.findOne({
            where: { job_no: job_no }
        });

        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: `Work order not found with job number: ${job_no}`
            });
        }

        // Create note using WorkOrderNote model with correct column name
        let note = await WorkOrderNote.create({
            note: note_content,  // Changed from content to note
            work_order_id: workOrder.id,
            created_by: 1, // System user ID
            source: 'webhook'
        });

        // Create notification for the new note
        await Alert.create({
            user_id: 1, // System user ID
            work_order_id: workOrder.id,
            type: 'note',
            message: `New note added via webhook for job ${job_no}`,
            is_read: false
        });

        return res.status(201).json({
            success: true,
            message: 'Note added successfully',
            data: {
                noteId: note.id,
                workOrderId: workOrder.id,
                jobNo: job_no,
                note: note.note,  // Changed from content to note
                createdAt: note.createdAt
            }
        });

    } catch (error) {
        console.error('Webhook error details:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while adding the note.',
            error: error.message
        });
    }
};

// Helper function to create notifications for the new note
async function notifyUsersAboutNote(workOrderId, noteId, createdById) {
    try {
        const staffUsers = await User.findAll({
            where: {
                role: ['staff', 'admin'],
                is_active: true
            }
        });

        for (const user of staffUsers) {
            await notificationController.createNotification(
                user.id,
                workOrderId,
                'note',
                'New Note Added',
                `A new note has been added to work order #${workOrderId} via webhook.`
            );
        }
    } catch (error) {
        console.error('Error creating note notifications:', error);
    }
}