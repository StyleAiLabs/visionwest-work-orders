// backend/services/completionWebhookService.js
const https = require('https');
const db = require('../models');

const WEBHOOK_URL = 'https://prod.app.sync360.co.nz/webhook/ffbc22bb-a052-4f96-a0e3-4c18a6cdd7d3';

/**
 * Fires a POST webhook to the n8n completion automation when a work order
 * is marked as completed. Fetches photos from the database and includes them
 * in the payload so the downstream pipeline doesn't need a separate API call.
 *
 * This is fire-and-forget — it never throws or blocks the HTTP response.
 *
 * @param {object} workOrder - Sequelize WorkOrder instance
 */
async function sendCompletionWebhook(workOrder) {
    console.log(`🔔 Firing completion webhook for work order #${workOrder.job_no}`);

    // Fetch photos for this work order
    let photos = [];
    try {
        const photoRecords = await db.photo.findAll({
            where: { work_order_id: workOrder.id },
            attributes: ['file_path', 'description']
        });
        photos = photoRecords.map(p => ({
            url: p.file_path || '',
            caption: p.description || ''
        }));
        console.log(`📷 Found ${photos.length} photo(s) for work order #${workOrder.job_no}`);
    } catch (photoError) {
        console.error('⚠️  Could not fetch photos for completion webhook:', photoError.message);
        // Continue with empty photos array — don't block the webhook
    }

    if (!workOrder.authorized_email) {
        console.warn(`⚠️  Work order #${workOrder.job_no} has no authorized_email — webhook will fire without recipient email`);
    }

    const payload = {
        job_no: String(workOrder.job_no),
        status: 'completed',
        data: {
            property_name: workOrder.property_name || '',
            description: workOrder.description || '',
            po_number: workOrder.po_number || null,
            authorized_email: workOrder.authorized_email || '',
            authorized_name: workOrder.authorized_by || '',
            photos
        }
    };

    try {
        const result = await postJSON(WEBHOOK_URL, payload);
        if (result.success) {
            console.log(`✅ Completion webhook sent for work order #${workOrder.job_no} (HTTP ${result.statusCode})`);
        } else {
            console.error(`❌ Completion webhook failed for work order #${workOrder.job_no}:`, {
                statusCode: result.statusCode,
                body: result.body
            });
        }
    } catch (err) {
        console.error(`❌ Completion webhook error for work order #${workOrder.job_no}:`, err.message);
    }
}

/**
 * Sends a JSON POST request and returns { success, statusCode, body }.
 * Never throws — rejects are caught and returned as { success: false }.
 */
function postJSON(url, data) {
    return new Promise((resolve) => {
        const body = JSON.stringify(data);
        const parsedUrl = new URL(url);

        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let rawBody = '';
            res.on('data', chunk => { rawBody += chunk; });
            res.on('end', () => {
                const success = res.statusCode >= 200 && res.statusCode < 300;
                resolve({ success, statusCode: res.statusCode, body: rawBody });
            });
        });

        req.on('error', (err) => {
            resolve({ success: false, statusCode: null, body: err.message });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            resolve({ success: false, statusCode: null, body: 'Request timed out after 10s' });
        });

        req.write(body);
        req.end();
    });
}

module.exports = { sendCompletionWebhook };
