// backend/services/smsService.js
const https = require('https');

class WebhookSMSService {
    constructor() {
        this.webhookUrl = 'https://autopilot-prod.thesafetycabinetwarehouse.com/webhook-test/17345d58-c722-451c-9917-d48b7cd04cbf';
        this.enabled = process.env.SMS_ENABLED !== 'false'; // Default to enabled

        console.log('📱 Webhook SMS Service initialized');
        console.log('Webhook URL:', this.webhookUrl);
        console.log('SMS Enabled:', this.enabled);
    }

    async sendSMS(phoneNumber, message, workOrderData = null) {
        if (!this.enabled) {
            console.log('SMS service disabled - would have sent:', { phoneNumber, message });
            return { success: false, reason: 'SMS service disabled' };
        }

        try {
            console.log(`📱 Sending SMS via webhook to ${phoneNumber}: ${message}`);

            const payload = {
                phone_number: this.cleanPhoneNumber(phoneNumber),
                message: message,
                timestamp: new Date().toISOString(),
                source: 'visionwest-work-orders',
                work_order: workOrderData ? {
                    job_no: workOrderData.job_no,
                    property_name: workOrderData.property_name,
                    status: workOrderData.status
                } : null
            };

            const result = await this.sendWebhookRequest(payload);

            if (result.success) {
                console.log('✅ SMS webhook sent successfully');
                return {
                    success: true,
                    webhook_response: result.data,
                    payload: payload
                };
            } else {
                console.error('❌ SMS webhook failed:', result.error);
                return {
                    success: false,
                    error: result.error,
                    payload: payload
                };
            }

        } catch (error) {
            console.error('❌ Error sending SMS webhook:', error);
            return {
                success: false,
                error: error.message,
                phone_number: phoneNumber,
                message: message
            };
        }
    }

    async sendWebhookRequest(payload) {
        return new Promise((resolve) => {
            const postData = JSON.stringify(payload);

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'VisionWest-WorkOrders/1.0'
                },
                timeout: 10000 // 10 second timeout
            };

            const req = https.request(this.webhookUrl, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const responseData = data ? JSON.parse(data) : {};
                        resolve({
                            success: res.statusCode >= 200 && res.statusCode < 300,
                            statusCode: res.statusCode,
                            data: responseData
                        });
                    } catch (parseError) {
                        resolve({
                            success: res.statusCode >= 200 && res.statusCode < 300,
                            statusCode: res.statusCode,
                            data: data,
                            parseError: parseError.message
                        });
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Webhook request error:', error);
                resolve({
                    success: false,
                    error: error.message
                });
            });

            req.on('timeout', () => {
                console.error('Webhook request timeout');
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout'
                });
            });

            req.write(postData);
            req.end();
        });
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

            // Send SMS via webhook
            const result = await this.sendSMS(recipientPhone, message, {
                job_no: workOrder.job_no,
                property_name: workOrder.property_name,
                status: newStatus,
                old_status: oldStatus
            });

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

        message += `For more details, contact your property manager. - VisionWest`;

        // Ensure message is within SMS limits (160 chars for single SMS)
        if (message.length > 160) {
            message = message.substring(0, 157) + '...';
        }

        return message;
    }
}

module.exports = new WebhookSMSService();