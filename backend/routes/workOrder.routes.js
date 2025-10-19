const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrder.controller');
const authMiddleware = require('../middleware/auth.middleware');
const clientScoping = require('../middleware/clientScoping');

// Apply auth middleware to all routes
router.use(authMiddleware.verifyToken);

// Apply client scoping to all routes (adds req.clientId from JWT)
// This ensures all work order operations are automatically scoped to the user's client
router.use(clientScoping.addClientScope);


router.get('/summary', authMiddleware.isAnyValidRole, workOrderController.getSummary);

// Routes accessible to all authenticated users
router.get('/authorized-persons', authMiddleware.isAnyValidRole, workOrderController.getAuthorizedPersons);
router.get('/', authMiddleware.isAnyValidRole, workOrderController.getAllWorkOrders);
router.get('/:id/notes', authMiddleware.isAnyValidRole, workOrderController.getWorkOrderNotes);
router.get('/:id', authMiddleware.isAnyValidRole, workOrderController.getWorkOrderById);

// Status updates - use the specialized middleware for client cancellations
router.patch('/:id/status', authMiddleware.handleWorkOrderStatusUpdate, workOrderController.updateWorkOrderStatus);

// Manual work order creation - client_admin (tenancy managers) only
// This route must be defined BEFORE the generic POST / route to avoid conflicts
// Automatically adds client_id to the work order from JWT
router.post('/', authMiddleware.isClientAdmin, clientScoping.enforceClientOnCreate, workOrderController.createManualWorkOrder);

// Update work order - staff and admin only
router.put('/:id', authMiddleware.isStaffOrAdmin, workOrderController.updateWorkOrder || workOrderController.createWorkOrder);

// Delete work order - admin only (staff cannot delete)
router.delete('/:id', authMiddleware.isAdmin, workOrderController.deleteWorkOrder);

module.exports = router;