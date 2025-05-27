// backend/routes/sms.routes.js
const express = require('express');
const router = express.Router();
const smsController = require('../controllers/sms.controller');
const { verifyToken, isStaff } = require('../middleware/auth.middleware');

// Get SMS history for a work order (staff only)
router.get('/work-order/:workOrderId/history',
    verifyToken,
    isStaff,
    smsController.getSMSHistory
);

// Test SMS functionality (admin only)
router.post('/test',
    verifyToken,
    isStaff,
    smsController.testSMS
);

module.exports = router;