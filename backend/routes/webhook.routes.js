// Updated routes/webhook.routes.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { validateWebhookApiKey } = require('../middleware/webhook-auth.middleware');

// Webhook verification endpoint (public)
router.get('/verify', webhookController.verifyWebhook);

// Create work order from email (protected with API key)
router.post('/work-orders', validateWebhookApiKey, webhookController.createWorkOrderFromEmail);

// Update existing work order from email (protected with API key)
router.put('/work-orders', validateWebhookApiKey, webhookController.updateWorkOrderFromEmail);

// Add note to work order (protected with API key)
router.post('/work-orders/notes', validateWebhookApiKey, webhookController.addNoteToWorkOrder);

module.exports = router;