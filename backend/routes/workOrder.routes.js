const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, isStaffOrAdmin, isAnyValidRole } = require('../middleware/auth.middleware');
const workOrderController = require('../controllers/workOrder.controller');
const photoController = require('../controllers/photo.controller');

// Apply auth middleware to all routes
router.use(verifyToken, isAnyValidRole);

// Routes that everyone (including clients) can access
router.get('/summary', workOrderController.getSummary);
router.get('/', workOrderController.getAllWorkOrders);
router.get('/:id', workOrderController.getWorkOrderById);

// Add note - allowed for all roles (including clients)
router.post('/:id/notes', workOrderController.addWorkOrderNote);

// Routes only for staff and admin
router.post('/', isStaffOrAdmin, workOrderController.createWorkOrder);
router.patch('/:id/status', isStaffOrAdmin, workOrderController.updateWorkOrderStatus);

// Fix the method name to match what's in the controller
router.post('/:id/photos', isStaffOrAdmin, photoController.uploadPhotos); // Changed from uploadPhoto to uploadPhotos
router.delete('/:id/photos/:photoId', isStaffOrAdmin, photoController.deletePhoto);

// Delete work order (admin only)
router.delete('/:id', isAdmin, workOrderController.deleteWorkOrder);

module.exports = router;