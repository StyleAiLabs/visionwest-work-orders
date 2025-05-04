const db = require('../models');
const Notification = db.notification;
const WorkOrder = db.workOrder;
const { Op } = db.Sequelize;

// Get all notifications for the authenticated user
exports.getNotifications = async (req, res) => {
    try {
        const { filter } = req.query;
        const userId = req.userId; // From auth middleware
        const whereClause = { user_id: userId };

        // Apply filter if provided
        if (filter && filter !== 'all') {
            if (filter === 'unread') {
                whereClause.is_read = false;
            } else if (['work-order', 'status-change', 'completion', 'urgent'].includes(filter)) {
                whereClause.type = filter;
            }
        }

        // Get notifications with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const notifications = await Notification.findAndCountAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit,
            offset,
            include: [
                {
                    model: WorkOrder,
                    attributes: ['id', 'job_no']
                }
            ]
        });

        // Format response
        const formattedNotifications = notifications.rows.map(notification => {
            // Calculate time ago string
            const timeAgo = getTimeAgo(notification.created_at);

            return {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                read: notification.is_read,
                time: timeAgo,
                workOrderId: notification.work_order_id,
                workOrderJobNo: notification.work_order ? notification.work_order.job_no : null
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedNotifications,
            pagination: {
                total: notifications.count,
                page,
                limit,
                pages: Math.ceil(notifications.count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching notifications.'
        });
    }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        const count = await Notification.count({
            where: {
                user_id: userId,
                is_read: false
            }
        });

        return res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error fetching unread notifications count:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching unread notifications count.'
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId; // From auth middleware

        // Find notification
        const notification = await Notification.findOne({
            where: {
                id,
                user_id: userId
            }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found.'
            });
        }

        // If already read, just return success
        if (notification.is_read) {
            return res.status(200).json({
                success: true,
                message: 'Notification is already marked as read.'
            });
        }

        // Update notification
        await notification.update({ is_read: true });

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read successfully!'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while marking the notification as read.'
        });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        // Update all unread notifications
        await Notification.update(
            { is_read: true },
            {
                where: {
                    user_id: userId,
                    is_read: false
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read successfully!'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while marking all notifications as read.'
        });
    }
};

// Create notification (internal use for other controllers)
exports.createNotification = async (userId, workOrderId, type, title, message) => {
    try {
        const notification = await Notification.create({
            user_id: userId,
            work_order_id: workOrderId,
            type,
            title,
            message,
            is_read: false,
            created_at: new Date()
        });

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Add these new helper functions
exports.notifyStatusChange = async (workOrderId, oldStatus, newStatus, updatedBy) => {
    try {
        const workOrder = await WorkOrder.findByPk(workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }

        const title = 'Work Order Status Updated';
        const message = `Job #${workOrder.job_no} status changed from ${oldStatus} to ${newStatus}`;

        // Create notifications for relevant staff and client
        const notificationPromises = [];

        // Add staff notification if assigned_to exists
        if (workOrder.assigned_to) {
            notificationPromises.push(
                this.createNotification(
                    workOrder.assigned_to,
                    workOrderId,
                    'status-change',
                    title,
                    message
                )
            );
        }

        // Add client notification if client_id exists
        if (workOrder.client_id) {
            notificationPromises.push(
                this.createNotification(
                    workOrder.client_id,
                    workOrderId,
                    'status-change',
                    title,
                    message
                )
            );
        }

        // Notify the updater as well
        if (updatedBy) {
            notificationPromises.push(
                this.createNotification(
                    updatedBy,
                    workOrderId,
                    'status-change',
                    title,
                    message
                )
            );
        }

        // Execute all notification creation promises
        await Promise.all(notificationPromises);
    } catch (error) {
        console.error('Error creating status change notification:', error);
        throw error;
    }
};

exports.notifyNewNote = async (workOrderId, noteContent, createdBy) => {
    try {
        const workOrder = await WorkOrder.findByPk(workOrderId);
        const title = 'New Note Added';
        const message = `New note added to Job #${workOrder.job_no}`;

        // Create notifications for all relevant users except the creator
        await Promise.all([
            // Notify staff
            this.createNotification(
                workOrder.assigned_to,
                workOrderId,
                'work-order',
                title,
                message
            ),
            // Notify client
            this.createNotification(
                workOrder.client_id,
                workOrderId,
                'work-order',
                title,
                message
            )
        ]);
    } catch (error) {
        console.error('Error creating new note notification:', error);
        throw error;
    }
};

exports.notifyPhotoUpdate = async (workOrderId, action, userId, photoCount) => {
    try {
        const workOrder = await WorkOrder.findByPk(workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }

        const title = `Photos ${action === 'add' ? 'Added' : 'Deleted'}`;
        const message = `${photoCount} photo${photoCount > 1 ? 's' : ''} ${action === 'add' ? 'added to' : 'deleted from'
            } Job #${workOrder.job_no}`;

        // Create notifications for relevant users
        await Promise.all([
            // Notify assigned staff
            this.createNotification(
                workOrder.assigned_to,
                workOrderId,
                'photo-update',
                title,
                message
            ),
            // Notify client if applicable
            workOrder.client_id && this.createNotification(
                workOrder.client_id,
                workOrderId,
                'photo-update',
                title,
                message
            )
        ]);

    } catch (error) {
        console.error('Error creating photo update notification:', error);
        throw error;
    }
};

// Helper function to format relative time
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);

    // Convert milliseconds to seconds
    const seconds = Math.floor(diff / 1000);

    // Less than a minute
    if (seconds < 60) {
        return 'just now';
    }

    // Less than an hour
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }

    // Less than a day
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    // Less than a week
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }

    // Format as date
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
}