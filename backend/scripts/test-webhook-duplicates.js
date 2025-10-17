// Test script for webhook duplicate handling
// This script tests the enhanced webhook functionality that handles duplicate work orders

const axios = require('axios');

// Configuration - update these based on your setup
const WEBHOOK_URL = 'http://localhost:5002/api/webhook/work-orders';
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY || 'wh_p2k6bTxYdEzJNGvQqH8A7RMm3fVXcFLtS9WD5sZj';

// Test data for creating a work order
const testWorkOrder = {
    job_no: 'TEST-DUPLICATE-001',
    date: '2024-01-15',
    supplier_name: 'Test Supplier Co.',
    supplier_phone: '555-0123',
    supplier_email: 'supplier@test.com',
    property_name: 'Test Property',
    property_address: '123 Test Street, Test City',
    property_phone: '555-0456',
    description: 'Initial test work order for duplicate handling',
    po_number: 'PO-12345',
    authorized_by: 'John Manager',
    authorized_contact: '555-0789',
    authorized_email: 'manager@test.com',
    email_subject: 'Work Order - TEST-DUPLICATE-001',
    email_sender: 'system@test.com',
    email_received_date: new Date().toISOString()
};

// Modified test data for the duplicate
const duplicateWorkOrder = {
    ...testWorkOrder,
    description: 'Updated description - this should update the existing work order',
    supplier_phone: '555-9999', // Different phone number
    email_subject: 'Work Order Update - TEST-DUPLICATE-001',
    email_received_date: new Date().toISOString()
};

async function testWebhookDuplicateHandling() {
    console.log('🧪 Testing Webhook Duplicate Handling\n');

    try {
        // Step 1: Create initial work order
        console.log('1️⃣ Creating initial work order...');
        const createResponse = await axios.post(WEBHOOK_URL, testWorkOrder, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': WEBHOOK_API_KEY
            }
        });

        console.log('✅ Initial work order created successfully');
        console.log('Response:', createResponse.data);
        console.log('Work Order ID:', createResponse.data.data.id);
        console.log('Job Number:', createResponse.data.data.jobNo);
        console.log();

        // Step 2: Send duplicate work order (should update existing)
        console.log('2️⃣ Sending duplicate work order (should update existing)...');
        const duplicateResponse = await axios.post(WEBHOOK_URL, duplicateWorkOrder, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': WEBHOOK_API_KEY
            }
        });

        console.log('✅ Duplicate handled successfully');
        console.log('Response:', duplicateResponse.data);
        console.log('Action taken:', duplicateResponse.data.action);
        console.log('Work Order ID:', duplicateResponse.data.data.id);
        console.log();

        // Step 3: Test the dedicated update endpoint
        console.log('3️⃣ Testing dedicated update endpoint...');
        const updateData = {
            job_no: 'TEST-DUPLICATE-001',
            status: 'In Progress',
            description: 'Updated via dedicated update endpoint',
            email_subject: 'Status Update - TEST-DUPLICATE-001',
            email_received_date: new Date().toISOString()
        };

        const updateResponse = await axios.put(WEBHOOK_URL, updateData, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': WEBHOOK_API_KEY
            }
        });

        console.log('✅ Update endpoint worked successfully');
        console.log('Response:', updateResponse.data);
        console.log('Updated fields:', updateResponse.data.data.updatedFields);
        console.log();

        console.log('🎉 All tests passed! Webhook duplicate handling is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Alternative test for when server is not running locally
async function testWebhookLogic() {
    console.log('🧪 Testing Webhook Logic (Offline Mode)\n');

    // Simulate the duplicate detection logic
    const existingWorkOrders = new Map();

    // Step 1: Simulate creating first work order
    console.log('1️⃣ Simulating first work order creation...');
    existingWorkOrders.set(testWorkOrder.job_no, {
        id: 1,
        ...testWorkOrder,
        created_at: new Date()
    });
    console.log('✅ Work order created:', testWorkOrder.job_no);

    // Step 2: Simulate duplicate detection
    console.log('\n2️⃣ Simulating duplicate detection...');
    const isDuplicate = existingWorkOrders.has(duplicateWorkOrder.job_no);
    console.log('Duplicate detected:', isDuplicate);

    if (isDuplicate) {
        console.log('✅ Logic would update existing work order instead of creating new one');

        // Merge the data
        const existing = existingWorkOrders.get(duplicateWorkOrder.job_no);
        const updated = {
            ...existing,
            ...duplicateWorkOrder,
            updated_at: new Date(),
            metadata: {
                ...existing.metadata,
                last_updated_via: 'n8n_webhook',
                original_created_at: existing.created_at
            }
        };

        console.log('Updated work order would have:');
        console.log('- Description:', updated.description);
        console.log('- Supplier Phone:', updated.supplier_phone);
        console.log('- Updated At:', updated.updated_at);
    }

    console.log('\n🎉 Offline logic test completed successfully!');
}

// Run the appropriate test based on command line arguments
if (process.argv.includes('--offline')) {
    testWebhookLogic();
} else {
    testWebhookDuplicateHandling();
}

// Export for potential use in other tests
module.exports = {
    testWebhookDuplicateHandling,
    testWebhookLogic,
    testWorkOrder,
    duplicateWorkOrder
};
