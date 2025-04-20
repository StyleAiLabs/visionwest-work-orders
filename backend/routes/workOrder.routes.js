const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrder.controller');
const { verifyToken, isAnyValidRole } = require('../middleware/auth.middleware');

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

module.exports = router;