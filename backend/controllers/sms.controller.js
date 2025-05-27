// backend/controllers/sms.controller.js
const smsService = require('../services/smsService');

// Test SMS functionality
const testSMS = async (req, res) => {
    try {
        console.log('📱 SMS Test endpoint called');
        console.log('Request body:', req.body);
        console.log('User:', req.userEmail, 'Role:', req.userRole);

        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }

        const result = await smsService.sendSMS(phoneNumber, message);

        return res.status(200).json({
            success: true,
            data: result,
            message: result.success ? 'SMS sent successfully' : 'SMS failed to send'
        });
    } catch (error) {
        console.error('❌ Error in SMS test endpoint:', error);
        return res.status(500).json({
            success: false,
            message: 'Error testing SMS',
            error: error.message
        });
    }
};

// Get SMS history for a work order
const getSMSHistory = async (req, res) => {
    try {
        const { workOrderId } = req.params;

        // For now, return empty array since we might not have the SMS table yet
        return res.status(200).json({
            success: true,
            data: [],
            message: 'SMS history retrieved (feature in development)'
        });
    } catch (error) {
        console.error('Error fetching SMS history:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching SMS history'
        });
    }
};

// Export functions
module.exports = {
    testSMS,
    getSMSHistory
};