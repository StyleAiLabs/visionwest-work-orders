// backend/routes/sms.routes.js
const express = require('express');
const router = express.Router();

// Safe middleware import with fallbacks
let verifyToken, isStaff;

try {
    const authMiddleware = require('../middleware/auth.middleware');
    verifyToken = authMiddleware.verifyToken;
    isStaff = authMiddleware.isStaff;

    console.log('✅ Auth middleware loaded');
    console.log('verifyToken:', typeof verifyToken);
    console.log('isStaff:', typeof isStaff);
} catch (error) {
    console.error('❌ Error loading auth middleware:', error);

    // Fallback middleware
    verifyToken = (req, res, next) => {
        console.log('⚠️ Using fallback verifyToken middleware');
        next();
    };

    isStaff = (req, res, next) => {
        console.log('⚠️ Using fallback isStaff middleware');
        next();
    };
}

// Safe controller import
let smsController;
try {
    smsController = require('../controllers/sms.controller');
    console.log('✅ SMS Controller loaded successfully');
    console.log('Available functions:', Object.keys(smsController));
    console.log('testSMS type:', typeof smsController.testSMS);
    console.log('getSMSHistory type:', typeof smsController.getSMSHistory);
} catch (error) {
    console.error('❌ Error loading SMS controller:', error);
    smsController = {};
}

// Validate middleware functions
if (typeof verifyToken !== 'function') {
    console.error('❌ verifyToken is not a function:', typeof verifyToken);
    verifyToken = (req, res, next) => next();
}

if (typeof isStaff !== 'function') {
    console.error('❌ isStaff is not a function:', typeof isStaff);
    isStaff = (req, res, next) => next();
}

// Validate controller functions
if (typeof smsController.testSMS !== 'function') {
    console.error('❌ testSMS is not a function:', typeof smsController.testSMS);
    smsController.testSMS = (req, res) => {
        res.status(500).json({ success: false, message: 'testSMS function not available' });
    };
}

if (typeof smsController.getSMSHistory !== 'function') {
    console.error('❌ getSMSHistory is not a function:', typeof smsController.getSMSHistory);
    smsController.getSMSHistory = (req, res) => {
        res.status(500).json({ success: false, message: 'getSMSHistory function not available' });
    };
}

// Simple test route (no middleware)
router.get('/ping', (req, res) => {
    res.json({
        success: true,
        message: 'SMS routes are working',
        timestamp: new Date().toISOString(),
        middleware: {
            verifyToken: typeof verifyToken,
            isStaff: typeof isStaff
        },
        controller: {
            testSMS: typeof smsController.testSMS,
            getSMSHistory: typeof smsController.getSMSHistory
        }
    });
});

// Define routes with validated functions
console.log('Setting up SMS routes...');

router.post('/test', verifyToken, isStaff, smsController.testSMS);
router.get('/work-order/:workOrderId/history', verifyToken, isStaff, smsController.getSMSHistory);

console.log('✅ SMS routes configured');

module.exports = router;