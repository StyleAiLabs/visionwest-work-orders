// backend/services/smsService.js
const twilio = require('twilio');

class SMSService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
        this.enabled = process.env.TWILIO_ENABLED === 'true';

        if (this.enabled && this.accountSid && this.authToken) {
            this.client = twilio(this.accountSid, this.authToken);
            console.log('✅ Twilio SMS service initialized');
        } else {
            console.log('⚠️  Twilio SMS service disabled or missing credentials');
        }
    }

    async sendSMS(to, message) {
        if (!this.enabled || !this.client) {
            console.log('SMS service disabled - would have sent:', { to, message });
            return { success: false, reason: 'SMS service disabled' };
        }

        try {
            // Clean phone number (remove spaces, dashes, etc.)
            const cleanNumber = this.cleanPhoneNumber(to);

            if (!this.isValidPhoneNumber(cleanNumber)) {
                throw new Error(`Invalid phone number format: ${to}`);
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

        // Remove all non-digit characters except +
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');

        // If it doesn't start with +, assume it's NZ number and add +64
        if (!cleaned.startsWith('+')) {
            // Remove leading 0 if present (NZ format)
            if (cleaned.startsWith('0')) {
                cleaned = cleaned.substring(1);
            }
            // Add NZ country code
            cleaned = '+64' + cleaned;
        }

        return cleaned;
    }

    isValidPhoneNumber(phoneNumber) {
        // Basic validation for international phone numbers
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }

    async sendWorkOrderStatusSMS(workOrder, oldStatus, newStatus, userRole = 'staff') {
        try {
            // Determine recipient phone number
            let recipientPhone = null;
            let recipientName = 'Team';

            // For VisionWest work orders, send to authorized contact
            if (workOrder.authorized_email && workOrder.authorized_email.includes('@visionwest.org.nz')) {
                recipientPhone = workOrder.authorized_contact || workOrder.property_phone;
                recipientName = workOrder.authorized_by || 'VisionWest Team';
            } else {
                // For other work orders, send to supplier
                recipientPhone = workOrder.supplier_phone;
                recipientName = workOrder.supplier_name || 'Supplier';
            }

            if (!recipientPhone) {
                console.log(`⚠️  No phone number available for work order ${workOrder.job_no}`);
                return { success: false, reason: 'No phone number available' };
            }

            // Create status-specific message
            const message = this.createStatusChangeMessage(workOrder, oldStatus, newStatus, recipientName);

            // Send SMS
            const result = await this.sendSMS(recipientPhone, message);

            // Log the SMS attempt
            await this.logSMSNotification(workOrder.id, recipientPhone, message, result.success, result.error);

            return result;

        } catch (error) {
            console.error('Error sending work order status SMS:', error);
            return { success: false, error: error.message };
        }
    }

    createStatusChangeMessage(workOrder, oldStatus, newStatus, recipientName) {
        const jobNo = workOrder.job_no;
        const property = workOrder.property_name;

        let message = `Hi ${recipientName}, `;

        switch (newStatus) {
            case 'in-progress':
                message += `Work has started on Job #${jobNo} at ${property}. `;
                break;
            case 'completed':
                message += `Job #${jobNo} at ${property} has been completed. `;
                break;
            case 'cancelled':
                message += `Job #${jobNo} at ${property} has been cancelled. `;
                break;
            default:
                message += `Job #${jobNo} at ${property} status updated to ${newStatus}. `;
        }

        message += `For more details, please check the app. - Williams Property Services`;

        // Ensure message is within SMS limits (160 chars for single SMS)
        if (message.length > 160) {
            message = message.substring(0, 157) + '...';
        }

        return message;
    }

    async logSMSNotification(workOrderId, phoneNumber, message, success, error = null) {
        try {
            const db = require('../models');
            const SMSNotification = db.smsNotification;

            if (SMSNotification) {
                await SMSNotification.create({
                    work_order_id: workOrderId,
                    phone_number: phoneNumber,
                    message: message,
                    status: success ? 'sent' : 'failed',
                    error_message: error,
                    sent_at: new Date()
                });
            }
        } catch (logError) {
            console.error('Error logging SMS notification:', logError);
        }
    }
}

module.exports = new SMSService();