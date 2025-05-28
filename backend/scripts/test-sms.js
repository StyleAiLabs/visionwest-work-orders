// backend/scripts/test-sms.js
const smsService = require('../services/smsService');

const testSMS = async () => {
    try {
        // Test with a real phone number (use your own for testing)
        const result = await smsService.sendSMS('+64225710164', 'Test SMS from VisionWest Work Orders system!');
        console.log('SMS Test Result:', result);
    } catch (error) {
        console.error('SMS Test Error:', error);
    }
};

testSMS();