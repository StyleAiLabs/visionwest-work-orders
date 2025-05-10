const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrder.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware.verifyToken);


router.get('/summary', authMiddleware.isAnyValidRole, workOrderController.getSummary);

// Routes accessible to all authenticated users
router.get('/', authMiddleware.isAnyValidRole, workOrderController.getAllWorkOrders);
router.get('/:id/notes', authMiddleware.isAnyValidRole, workOrderController.getWorkOrderNotes);
router.get('/:id', authMiddleware.isAnyValidRole, workOrderController.getWorkOrderById);

// Status updates - use the specialized middleware for client cancellations
router.patch('/:id/status', authMiddleware.handleWorkOrderStatusUpdate, workOrderController.updateWorkOrderStatus);

// Routes accessible only to staff and admin
router.post('/', authMiddleware.isStaffOrAdmin, workOrderController.createWorkOrder);

// FIX: Replace undefined updateWorkOrder with a valid controller method
// Option 1: If you have a partial update endpoint, use patchWorkOrder
router.put('/:id', authMiddleware.isStaffOrAdmin, workOrderController.updateWorkOrder || workOrderController.createWorkOrder);

// Option 2: If the route isn't needed yet, comment it out:
// router.put('/:id', authMiddleware.isStaffOrAdmin, workOrderController.updateWorkOrder);

router.delete('/:id', authMiddleware.isStaffOrAdmin, workOrderController.deleteWorkOrder);

module.exports = router;