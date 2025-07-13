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
        console.log('Webhook received data:', JSON.stringify(req.body, null, 2));

        // Extract data sent by n8n
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
            authorized_email,
            email_subject,
            email_sender,
            email_received_date,
            attachment_data
        } = req.body;

        // Validate required fields
        if (!job_no || !supplier_name || !property_name || !description) {
            console.log('Validation failed - missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields. Please provide job number, supplier name, property name, and description.'
            });
        }

        console.log(`Processing work order with job number: ${job_no}`);

        // Check if work order with the same job number already exists
        const existingWorkOrder = await WorkOrder.findOne({ where: { job_no } });

        if (existingWorkOrder) {
            console.log(`Found existing work order with job number: ${job_no}. Updating instead of creating new one.`);

            // Update the existing work order with new data
            const updatedWorkOrder = await existingWorkOrder.update({
                date: date || existingWorkOrder.date,
                supplier_name: supplier_name || existingWorkOrder.supplier_name,
                supplier_phone: supplier_phone || existingWorkOrder.supplier_phone,
                supplier_email: supplier_email || existingWorkOrder.supplier_email,
                property_name: property_name || existingWorkOrder.property_name,
                property_address: property_address || existingWorkOrder.property_address,
                property_phone: property_phone || existingWorkOrder.property_phone,
                description: description || existingWorkOrder.description,
                po_number: po_number || existingWorkOrder.po_number,
                authorized_by: authorized_by || existingWorkOrder.authorized_by,
                authorized_contact: authorized_contact || existingWorkOrder.authorized_contact,
                authorized_email: authorized_email || existingWorkOrder.authorized_email,
                // Update work order type if it wasn't set before
                work_order_type: existingWorkOrder.work_order_type || 'email',
                // Merge metadata while preserving existing data
                metadata: {
                    ...existingWorkOrder.metadata,
                    email_subject,
                    email_sender,
                    email_received_date,
                    last_updated_via: 'n8n_workflow',
                    last_updated_at: new Date().toISOString()
                }
            });

            // Add a note about the update
            await WorkOrderNote.create({
                note: `Work order updated via email webhook. ${description ? 'New description: ' + description : 'No description changes.'}`,
                work_order_id: existingWorkOrder.id,
                created_by: adminUser.id
            });

            // Notify relevant staff about the work order update
            await notifyUsersAboutWorkOrderUpdate(existingWorkOrder.id, adminUser.id);

            return res.status(200).json({
                success: true,
                message: 'Work order updated successfully from email!',
                data: {
                    id: existingWorkOrder.id,
                    jobNo: existingWorkOrder.job_no,
                    status: existingWorkOrder.status,
                    updated: true
                }
            });
        }

        // Find admin user to set as creator
        const adminUser = await User.findOne({ where: { role: 'admin' } });
        if (!adminUser) {
            console.log('No admin user found');
            return res.status(500).json({
                success: false,
                message: 'No admin user found to assign as creator.'
            });
        }

        console.log(`Creating new work order with job number: ${job_no}`);

        // Create new work order
        const workOrder = await WorkOrder.create({
            job_no,
            date: date || new Date(),
            status: 'pending',
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

        console.log(`Work order created successfully with ID: ${workOrder.id}`);

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

// Create notifications for relevant users about work order updates
async function notifyUsersAboutWorkOrderUpdate(workOrderId, updatedById) {
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
                'Work Order Updated',
                `A work order has been automatically updated from an email.`,
            );
        }

        // Create notifications for client users
        for (const user of clientUsers) {
            await notificationController.createNotification(
                user.id,
                workOrderId,
                'work-order',
                'Work Order Updated',
                `A work order has been updated with new information.`,
            );
        }
    } catch (error) {
        console.error('Error creating update notifications:', error);
    }
}

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
        const { job_no, note_content } = req.body;

        // Find work order
        const workOrder = await WorkOrder.findOne({
            where: { job_no: job_no }
        });

        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: `Work order not found: ${job_no}`
            });
        }

        // Create work order note with correct column names
        const note = await WorkOrderNote.create({
            note: note_content,
            work_order_id: workOrder.id,
            created_by: 1  // System user ID
        }, {
            // This ensures Sequelize uses the correct column names
            fields: ['note', 'work_order_id', 'created_by']
        });

        return res.status(201).json({
            success: true,
            message: 'Note added successfully',
            data: {
                id: note.id,
                workOrderId: note.work_order_id,
                jobNo: job_no,
                note: note.note,
                createdBy: note.created_by
            }
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while adding the note.',
            error: error.message
        });
    }
};

// Update notifyUsersAboutNote function
async function notifyUsersAboutNote(workOrderId, noteId, createdById) {
    try {
        const staffUsers = await User.findAll({
            where: {
                role: ['staff', 'admin'],
                is_active: true
            }
        });

        // Include VisionWest admin users
        const visionwestUsers = await User.findAll({
            where: {
                role: ['client', 'client_admin'],
                is_active: true
            }
        });

        // Notify staff users
        for (const user of staffUsers) {
            await notificationController.createNotification(
                user.id,
                workOrderId,
                'note',
                'New Note Added',
                `A new note has been added to work order #${workOrderId} via webhook.`
            );
        }

        // Notify VisionWest users
        for (const user of visionwestUsers) {
            await notificationController.createNotification(
                user.id,
                workOrderId,
                'note',
                'New Note Added',
                `A new note has been added to work order #${workOrderId}.`
            );
        }
    } catch (error) {
        console.error('Error creating note notifications:', error);
    }
}

// Update existing work order from webhook
exports.updateWorkOrderFromEmail = async (req, res) => {
    try {
        console.log('Update webhook received data:', JSON.stringify(req.body, null, 2));

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
            authorized_email,
            email_subject,
            email_sender,
            email_received_date,
            status // Allow status updates
        } = req.body;

        // Job number is required for updates
        if (!job_no) {
            return res.status(400).json({
                success: false,
                message: 'Job number is required for work order updates.'
            });
        }

        // Find the existing work order
        const existingWorkOrder = await WorkOrder.findOne({ where: { job_no } });

        if (!existingWorkOrder) {
            return res.status(404).json({
                success: false,
                message: `Work order with job number ${job_no} not found.`
            });
        }

        console.log(`Updating existing work order: ${job_no}`);

        // Find admin user for audit trail
        const adminUser = await User.findOne({ where: { role: 'admin' } });

        // Prepare update data (only update fields that are provided)
        const updateData = {};
        if (date) updateData.date = date;
        if (supplier_name) updateData.supplier_name = supplier_name;
        if (supplier_phone) updateData.supplier_phone = supplier_phone;
        if (supplier_email) updateData.supplier_email = supplier_email;
        if (property_name) updateData.property_name = property_name;
        if (property_address) updateData.property_address = property_address;
        if (property_phone) updateData.property_phone = property_phone;
        if (description) updateData.description = description;
        if (po_number) updateData.po_number = po_number;
        if (authorized_by) updateData.authorized_by = authorized_by;
        if (authorized_contact) updateData.authorized_contact = authorized_contact;
        if (authorized_email) updateData.authorized_email = authorized_email;
        if (status) updateData.status = status;

        // Update metadata
        updateData.metadata = {
            ...existingWorkOrder.metadata,
            email_subject,
            email_sender,
            email_received_date,
            last_updated_via: 'n8n_update_webhook',
            last_updated_at: new Date().toISOString()
        };

        // Perform the update
        const updatedWorkOrder = await existingWorkOrder.update(updateData);

        // Add a note about the update if there were meaningful changes
        const changedFields = Object.keys(updateData).filter(key => key !== 'metadata');
        if (changedFields.length > 0 && adminUser) {
            await WorkOrderNote.create({
                note: `Work order updated via email webhook. Updated fields: ${changedFields.join(', ')}`,
                work_order_id: existingWorkOrder.id,
                created_by: adminUser.id
            });
        }

        // Notify users about the update
        if (adminUser) {
            await notifyUsersAboutWorkOrderUpdate(existingWorkOrder.id, adminUser.id);
        }

        console.log(`Work order ${job_no} updated successfully`);

        return res.status(200).json({
            success: true,
            message: 'Work order updated successfully from email!',
            data: {
                id: existingWorkOrder.id,
                jobNo: existingWorkOrder.job_no,
                status: updatedWorkOrder.status,
                updatedFields: changedFields
            }
        });

    } catch (error) {
        console.error('Error updating work order from email:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating the work order from email.',
            error: error.message
        });
    }
};