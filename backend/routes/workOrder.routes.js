const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, isAnyValidRole } = require('../middleware/auth.middleware');
const workOrderController = require('../controllers/workOrder.controller');

// Apply auth middleware to all routes
router.use(verifyToken, isAnyValidRole);

// Get work order summary for dashboard
router.get('/summary', workOrderController.getSummary);

// Get all work orders (with filtering)
router.get('/', workOrderController.getAllWorkOrders);

// Get work order by ID
router.get('/:id', workOrderController.getWorkOrderById);

// Create new work order
router.post('/', workOrderController.createWorkOrder);

// Update work order status
router.patch('/:id/status', workOrderController.updateWorkOrderStatus);

// Add note to work order
router.post('/:id/notes', workOrderController.addWorkOrderNote);

// Delete work order and all related data (admin only)
router.delete('/:workOrderId', verifyToken, isAdmin, workOrderController.deleteWorkOrder);

module.exports = router;