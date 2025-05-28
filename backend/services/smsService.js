// backend/services/smsService.js
const https = require('https');
const http = require('http'); // Add this for HTTP fallback

class WebhookSMSService {
    constructor() {
        this.webhookUrl = 'https://autopilot-prod.thesafetycabinetwarehouse.com/webhook-test/ca02d55f-f9a1-40e9-8b5c-e75fdaf0bc13';
        this.enabled = process.env.SMS_ENABLED !== 'false'; // Default to enabled

        console.log('📱 Webhook SMS Service initialized');
        console.log('Webhook URL:', this.webhookUrl);
        console.log('SMS Enabled:', this.enabled);
    }

    async sendWorkOrderStatusSMS(workOrder, oldStatus, newStatus, userRole = 'staff') {
        console.log('🔔 sendWorkOrderStatusSMS called with:', {
            jobNo: workOrder.job_no,
            oldStatus,
            newStatus,
            userRole,
            hasAuthorizedEmail: !!workOrder.authorized_email,
            hasAuthorizedContact: !!workOrder.authorized_contact,
            hasPropertyPhone: !!workOrder.property_phone,
            hasSupplierPhone: !!workOrder.supplier_phone
        });

        try {
            // Determine recipient phone number
            let recipientPhone = null;
            let recipientName = 'Team';

            // For VisionWest work orders, send to authorized contact
            if (workOrder.authorized_email && workOrder.authorized_email.includes('@visionwest.org.nz')) {
                recipientPhone = workOrder.authorized_contact || workOrder.property_phone;
                recipientName = workOrder.authorized_by || 'VisionWest Team';
                console.log('📞 VisionWest work order - using authorized contact');
            } else {
                // For other work orders, send to supplier
                recipientPhone = workOrder.supplier_phone;
                recipientName = workOrder.supplier_name || 'Supplier';
                console.log('📞 External work order - using supplier phone');
            }

            console.log('📞 Recipient details:', {
                phone: recipientPhone,
                name: recipientName,
                cleanedPhone: this.cleanPhoneNumber(recipientPhone)
            });

            if (!recipientPhone) {
                console.log(`⚠️  No phone number available for work order ${workOrder.job_no}`);
                return { success: false, reason: 'No phone number available' };
            }

            // Create status-specific message
            const message = this.createStatusChangeMessage(workOrder, oldStatus, newStatus, recipientName);

            console.log('📱 SMS Message created:', message);

            // Send SMS via webhook
            const result = await this.sendSMS(recipientPhone, message, {
                job_no: workOrder.job_no,
                property_name: workOrder.property_name,
                status: newStatus,
                old_status: oldStatus
            });

            console.log('📱 SMS webhook result:', result);
            return result;

        } catch (error) {
            console.error('❌ Error in sendWorkOrderStatusSMS:', error);
            return { success: false, error: error.message };
        }
    }

    async sendSMS(phoneNumber, message, workOrderData = null) {
        console.log('📱 sendSMS called:', {
            phoneNumber,
            message,
            workOrderData,
            enabled: this.enabled
        });

        if (!this.enabled) {
            console.log('📱 SMS service disabled');
            return { success: false, reason: 'SMS service disabled' };
        }

        try {
            const cleanPhone = this.cleanPhoneNumber(phoneNumber);
            console.log(`📱 Sending SMS via webhook to ${cleanPhone}`);

            const payload = {
                phone_number: cleanPhone,
                message: message,
                timestamp: new Date().toISOString(),
                source: 'visionwest-work-orders',
                work_order: workOrderData
            };

            console.log('📤 Webhook payload:', JSON.stringify(payload, null, 2));

            const result = await this.sendWebhookRequest(payload);

            console.log('📥 Full webhook response:', JSON.stringify(result, null, 2));

            if (result.success) {
                console.log('✅ SMS webhook sent successfully');
                return {
                    success: true,
                    webhook_response: result.data,
                    payload: payload,
                    statusCode: result.statusCode
                };
            } else {
                console.error('❌ SMS webhook failed with details:', {
                    statusCode: result.statusCode,
                    error: result.error,
                    rawResponse: result.rawResponse,
                    data: result.data
                });
                return {
                    success: false,
                    error: result.error || `HTTP ${result.statusCode}`,
                    statusCode: result.statusCode,
                    rawResponse: result.rawResponse,
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
            const url = new URL(this.webhookUrl);

            console.log('🔗 Making webhook request to:', this.webhookUrl);
            console.log('🔗 Parsed URL:', {
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port,
                pathname: url.pathname
            });
            console.log('📦 Request payload size:', postData.length, 'bytes');

            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'VisionWest-WorkOrders/1.0',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Encoding': 'gzip, deflate, br'
                },
                timeout: 15000 // 15 second timeout
            };

            console.log('📡 Request options:', JSON.stringify(options, null, 2));

            const client = url.protocol === 'https:' ? https : http;

            const req = client.request(options, (res) => {
                let data = '';

                console.log('📡 Webhook response status:', res.statusCode);
                console.log('📡 Webhook response headers:', JSON.stringify(res.headers, null, 2));

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log('📡 Webhook response body length:', data.length);
                    console.log('📡 Webhook response body:', data);

                    let responseData;
                    try {
                        responseData = data ? JSON.parse(data) : {};
                        console.log('📡 Parsed response data:', JSON.stringify(responseData, null, 2));
                    } catch (parseError) {
                        console.error('❌ Error parsing webhook response:', parseError);
                        responseData = { raw: data, parseError: parseError.message };
                    }

                    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
                    console.log('📡 Request success:', isSuccess);

                    resolve({
                        success: isSuccess,
                        statusCode: res.statusCode,
                        data: responseData,
                        rawResponse: data,
                        headers: res.headers
                    });
                });
            });

            req.on('error', (error) => {
                console.error('❌ Webhook request error:', error);
                resolve({
                    success: false,
                    error: error.message,
                    code: error.code,
                    errno: error.errno,
                    syscall: error.syscall,
                    hostname: error.hostname
                });
            });

            req.on('timeout', () => {
                console.error('❌ Webhook request timeout');
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout (15s)'
                });
            });

            req.setTimeout(15000, () => {
                console.error('❌ Request timeout after 15 seconds');
                req.destroy();
            });

            console.log('📤 Sending webhook request...');
            req.write(postData);
            req.end();
        });
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

    async sendWorkOrderStatusSMS(workOrder, oldStatus, newStatus, userRole = 'staff') {
        console.log('🔔 sendWorkOrderStatusSMS called');

        try {
            let recipientPhone = null;
            let recipientName = 'Team';

            if (workOrder.authorized_email && workOrder.authorized_email.includes('@visionwest.org.nz')) {
                recipientPhone = workOrder.authorized_contact || workOrder.property_phone;
                recipientName = workOrder.authorized_by || 'VisionWest Team';
            } else {
                recipientPhone = workOrder.supplier_phone;
                recipientName = workOrder.supplier_name || 'Supplier';
            }

            if (!recipientPhone) {
                console.log(`⚠️  No phone number available for work order ${workOrder.job_no}`);
                return { success: false, reason: 'No phone number available' };
            }

            const message = this.createStatusChangeMessage(workOrder, oldStatus, newStatus, recipientName);

            const result = await this.sendSMS(recipientPhone, message, {
                job_no: workOrder.job_no,
                property_name: workOrder.property_name,
                status: newStatus,
                old_status: oldStatus
            });

            return result;

        } catch (error) {
            console.error('❌ Error in sendWorkOrderStatusSMS:', error);
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

        if (message.length > 160) {
            message = message.substring(0, 157) + '...';
        }

        return message;
    }
}

module.exports = new WebhookSMSService();