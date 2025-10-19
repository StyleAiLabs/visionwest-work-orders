const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

// Apply admin role check to all routes
router.use(authMiddleware.isAdmin);

// Client Management Routes (Admin Only)

// IMPORTANT: Specific routes must come before parameterized routes
// Get simple client list for dropdown (no pagination)
router.get('/list', clientController.getClients);

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
