const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

// IMPORTANT: Specific routes must come before parameterized routes
// Get simple client list for dropdown (no pagination) - Staff and Admin access
router.get('/list', authMiddleware.isStaffOrAdmin, clientController.getClients);

// Apply admin role check to remaining routes (Client Management - Admin Only)
router.use(authMiddleware.isAdmin);

// List all clients with pagination, filtering, and search
router.get('/', clientController.getAllClients);

// Get client statistics (specific route before :id)
router.get('/:id/stats', clientController.getClientStats);

// Get client by ID with stats
router.get('/:id', clientController.getClientById);

// Create new client
router.post('/', clientController.createClient);

// Update client (code is immutable)
router.put('/:id', clientController.updateClient);

// Delete client (soft delete - archives)
router.delete('/:id', clientController.deleteClient);

module.exports = router;
