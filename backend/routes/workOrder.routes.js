const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrder.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware.verifyToken);

// Routes accessible to all authenticated users
router.get('/', authMiddleware.isAnyValidRole, workOrderController.getAllWorkOrders);
router.get('/:id', authMiddleware.isAnyValidRole, workOrderController.getWorkOrderById);

// Status updates - use the specialized middleware to handle client cancellations
router.patch('/:id/status', authMiddleware.verifyToken, authMiddleware.handleWorkOrderStatusUpdate, workOrderController.updateWorkOrderStatus);

// Routes accessible only to staff and admin
router.post('/', authMiddleware.isStaffOrAdmin, workOrderController.createWorkOrder);
router.put('/:id', authMiddleware.isStaffOrAdmin, workOrderController.updateWorkOrder);
router.delete('/:id', authMiddleware.isStaffOrAdmin, workOrderController.deleteWorkOrder);

module.exports = router;