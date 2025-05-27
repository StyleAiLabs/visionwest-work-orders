// backend/routes/sms.routes.js
const express = require('express');
const router = express.Router();

// Import middleware
const { verifyToken, isStaff } = require('../middleware/auth.middleware');

// Import controller with error handling
let smsController;
try {
    smsController = require('../controllers/sms.controller');
    console.log('✅ SMS Controller loaded successfully');
    console.log('Available functions:', Object.keys(smsController));
} catch (error) {
    console.error('❌ Error loading SMS controller:', error);
    // Provide fallback functions
    smsController = {
        testSMS: (req, res) => res.status(500).json({ success: false, message: 'SMS controller not loaded' }),
        getSMSHistory: (req, res) => res.status(500).json({ success: false, message: 'SMS controller not loaded' })
    };
}

// Verify functions exist
if (typeof smsController.testSMS !== 'function') {
    console.error('❌ testSMS function is not available');
    smsController.testSMS = (req, res) => res.status(500).json({ success: false, message: 'testSMS function not available' });
}

if (typeof smsController.getSMSHistory !== 'function') {
    console.error('❌ getSMSHistory function is not available');
    smsController.getSMSHistory = (req, res) => res.status(500).json({ success: false, message: 'getSMSHistory function not available' });
}

// Define routes
router.post('/test', verifyToken, isStaff, smsController.testSMS);
router.get('/work-order/:workOrderId/history', verifyToken, isStaff, smsController.getSMSHistory);

// Add a simple test route to verify the router works
router.get('/ping', (req, res) => {
    res.json({
        success: true,
        message: 'SMS routes are working',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;