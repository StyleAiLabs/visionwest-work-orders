// backend/controllers/sms.controller.js
const db = require('../models');
const SMSNotification = db.smsNotification;
const smsService = require('../services/smsService');

// Test SMS functionality
exports.testSMS = async (req, res) => {
    try {
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
        console.error('Error testing SMS:', error);
        return res.status(500).json({
            success: false,
            message: 'Error testing SMS',
            error: error.message
        });
    }
};

// Get SMS history for a work order
exports.getSMSHistory = async (req, res) => {
    try {
        const { workOrderId } = req.params;

        const smsHistory = await SMSNotification.findAll({
            where: { work_order_id: workOrderId },
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: smsHistory
        });
    } catch (error) {
        console.error('Error fetching SMS history:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching SMS history'
        });
    }
};

module.exports = {
    testSMS: exports.testSMS,
    getSMSHistory: exports.getSMSHistory
};