const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken, isAnyValidRole } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(verifyToken, isAnyValidRole);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Get unread notifications count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Mark notification as read
router.patch('/:id', notificationController.markAsRead);

module.exports = router;