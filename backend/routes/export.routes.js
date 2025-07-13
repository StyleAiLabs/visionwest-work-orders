const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all export routes
router.use(authMiddleware.verifyToken);

// Export work order as PDF
router.get('/workorder/:id/pdf', exportController.exportWorkOrderPDF);

// Get export capabilities/status
router.get('/status', exportController.getExportStatus);

module.exports = router;
