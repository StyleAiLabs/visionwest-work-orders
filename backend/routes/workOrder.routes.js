const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrder.controller');
const { verifyToken, isAnyValidRole, isStaffOrAdmin } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(verifyToken);

// Routes accessible to all authenticated users
router.get('/', isAnyValidRole, workOrderController.getAllWorkOrders);
router.get('/:id', isAnyValidRole, workOrderController.getWorkOrderById);

// Status updates - use isAnyValidRole to allow client cancellations
router.patch('/:id/status', verifyToken, authMiddleware.handleWorkOrderStatusUpdate, workOrderController.updateWorkOrderStatus);

// Routes accessible only to staff and admin
router.post('/', isStaffOrAdmin, workOrderController.createWorkOrder);
router.put('/:id', isStaffOrAdmin, workOrderController.updateWorkOrder);
router.delete('/:id', isStaffOrAdmin, workOrderController.deleteWorkOrder);

module.exports = router;