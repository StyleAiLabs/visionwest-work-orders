// backend/services/smsService.js
let twilio;
try {
    twilio = require('twilio');
} catch (error) {
    console.error('Twilio package not found:', error);
    twilio = null;
}

class SMSService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
        this.enabled = process.env.TWILIO_ENABLED === 'true';

        console.log('🔧 SMS Service Config:', {
            accountSid: this.accountSid ? '✅ Set' : '❌ Missing',
            authToken: this.authToken ? '✅ Set' : '❌ Missing',
            fromNumber: this.fromNumber ? '✅ Set' : '❌ Missing',
            enabled: this.enabled,
            twilioAvailable: !!twilio
        });

        if (this.enabled && this.accountSid && this.authToken && twilio) {
            try {
                this.client = twilio(this.accountSid, this.authToken);
                console.log('✅ Twilio SMS service initialized');
            } catch (error) {
                console.error('❌ Error initializing Twilio client:', error);
                this.client = null;
            }
        } else {
            console.log('⚠️  Twilio SMS service disabled or missing credentials');
            this.client = null;
        }
    }

    async sendSMS(to, message) {
        console.log(`📱 SendSMS called with: ${to}, "${message}"`);

        if (!this.enabled || !this.client) {
            console.log('SMS service disabled - would have sent:', { to, message });
            return {
                success: false,
                reason: 'SMS service disabled or not configured',
                config: {
                    enabled: this.enabled,
                    hasClient: !!this.client,
                    hasAccountSid: !!this.accountSid,
                    hasAuthToken: !!this.authToken,
                    hasFromNumber: !!this.fromNumber,
                    twilioAvailable: !!twilio
                }
            };
        }

        try {
            const cleanNumber = this.cleanPhoneNumber(to);

            if (!this.isValidPhoneNumber(cleanNumber)) {
                throw new Error(`Invalid phone number format: ${to} -> ${cleanNumber}`);
            }

            console.log(`📱 Sending SMS to ${cleanNumber}: ${message}`);

            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: cleanNumber
            });

            console.log(`✅ SMS sent successfully. SID: ${result.sid}`);
            return {
                success: true,
                sid: result.sid,
                to: cleanNumber,
                message: message
            };

        } catch (error) {
            console.error('❌ Error sending SMS:', error);
            return {
                success: false,
                error: error.message,
                to: to,
                message: message
            };
        }
    }

    cleanPhoneNumber(phoneNumber) {
        if (!phoneNumber) return '';

        let cleaned = phoneNumber.replace(/[^\d+]/g, '');

        if (!cleaned.startsWith('+')) {
            if (cleaned.startsWith('0')) {
                cleaned = cleaned.substring(1);
            }
            cleaned = '+64' + cleaned;
        }

        return cleaned;
    }

    isValidPhoneNumber(phoneNumber) {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }
}

module.exports = new SMSService();