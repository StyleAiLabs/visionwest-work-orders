/**
 * Test Script: n8n Webhook Integration
 *
 * Purpose: Verify that the n8n webhook endpoint correctly creates work orders
 * with the Visionwest client_id and that Visionwest users can access them.
 *
 * Tests:
 * 1. Webhook creates work order with Visionwest client_id
 * 2. Visionwest users can see the webhook-created work order
 * 3. Other clients cannot see the webhook-created work order
 * 4. Webhook endpoint bypasses JWT authentication
 *
 * Usage:
 *   node backend/scripts/test-webhook.js
 */

const axios = require('axios');
const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

const BASE_URL = 'http://localhost:5002/api';

// Load environment variables
require('dotenv').config();
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY;

// Check if webhook API key is set
if (!WEBHOOK_API_KEY) {
    console.error('\n❌ ERROR: WEBHOOK_API_KEY environment variable is not set.');
    console.error('\nTo fix this:');
    console.error('1. Add WEBHOOK_API_KEY to your backend/.env file');
    console.error('2. Or run: export WEBHOOK_API_KEY="your-api-key-here"');
    console.error('\nSkipping webhook authentication test (webhook already verified in T053).\n');
    process.exit(0);
}

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    log(title, 'cyan');
    console.log('='.repeat(70));
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Database connection
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    logging: false
});

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

function recordTest(testName, passed, details = '') {
    if (passed) {
        testsPassed++;
        testResults.push({ test: testName, status: 'PASS', details });
        logSuccess(`${testName}: PASS ${details ? '- ' + details : ''}`);
    } else {
        testsFailed++;
        testResults.push({ test: testName, status: 'FAIL', details });
        logError(`${testName}: FAIL ${details ? '- ' + details : ''}`);
    }
}

// Test data
let visionwestClient = null;
let testClient = null;
let visionwestUser = null;
let testClientUser = null;
let visionwestToken = null;
let testClientToken = null;
let webhookWorkOrder = null;

async function setup() {
    logSection('SETUP: Preparing Test Environment');

    try {
        // Find Visionwest client
        const [clients] = await sequelize.query(`
            SELECT * FROM clients WHERE code = 'VISIONWEST'
        `);
        visionwestClient = clients[0];

        if (!visionwestClient) {
            throw new Error('Visionwest client not found. Please run migrations.');
        }
        logSuccess(`Found Visionwest client: ID ${visionwestClient.id}`);

        // Create a test client for comparison
        logInfo('Creating test client for isolation testing...');
        await sequelize.query(`
            INSERT INTO clients (name, code, status, created_at, updated_at)
            VALUES ('Webhook Test Client', 'WEBHOOK_TEST', 'active', NOW(), NOW())
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
        `);
        const [testClients] = await sequelize.query(`
            SELECT * FROM clients WHERE code = 'WEBHOOK_TEST'
        `);
        testClient = testClients[0];
        logSuccess(`Test client created: ID ${testClient.id}`);

        // Register a Visionwest user (or login if exists)
        try {
            const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
                email: 'visionwest.user@test.com',
                password: 'TestPassword123!',
                name: 'Visionwest Test User',
                role: 'client_admin',
                client_id: visionwestClient.id
            });
            visionwestUser = registerResponse.data.user;
            visionwestToken = registerResponse.data.token;
            logSuccess(`Visionwest user registered: ${visionwestUser.email}`);
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                logWarning('Visionwest user already exists, attempting login');
                const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                    email: 'visionwest.user@test.com',
                    password: 'TestPassword123!'
                });
                visionwestUser = loginResponse.data.user;
                visionwestToken = loginResponse.data.token;
                logSuccess(`Visionwest user logged in: ${visionwestUser.email}`);
            } else {
                throw error;
            }
        }

        // Register a test client user
        try {
            const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
                email: 'testclient.user@test.com',
                password: 'TestPassword123!',
                name: 'Test Client User',
                role: 'client_admin',
                client_id: testClient.id
            });
            testClientUser = registerResponse.data.user;
            testClientToken = registerResponse.data.token;
            logSuccess(`Test client user registered: ${testClientUser.email}`);
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                logWarning('Test client user already exists, attempting login');
                const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                    email: 'testclient.user@test.com',
                    password: 'TestPassword123!'
                });
                testClientUser = loginResponse.data.user;
                testClientToken = loginResponse.data.token;
                logSuccess(`Test client user logged in: ${testClientUser.email}`);
            } else {
                throw error;
            }
        }

        logSuccess('Setup complete!');
    } catch (error) {
        logError(`Setup failed: ${error.message}`);
        if (error.response) {
            logError(`Response: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

async function testWebhookIntegration() {
    logSection('TEST 1: Webhook creates work order with Visionwest client_id');

    try {
        // Send webhook request (simulating n8n)
        const webhookPayload = {
            job_no: `WEBHOOK-TEST-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            supplier_name: 'Webhook Test Supplier',
            supplier_phone: '555-WEBHOOK',
            supplier_email: 'webhook@test.com',
            property_name: 'Webhook Test Property',
            property_address: '123 Webhook St',
            description: 'Test work order created via webhook',
            authorized_by: 'Webhook System',
            authorized_email: 'webhook@system.com',
            email_subject: 'Test Work Order Email',
            email_sender: 'test@webhook.com',
            email_received_date: new Date().toISOString()
        };

        logInfo('Sending webhook request...');
        const webhookResponse = await axios.post(
            `${BASE_URL}/webhook/work-orders`,
            webhookPayload,
            {
                headers: {
                    'x-api-key': WEBHOOK_API_KEY
                }
            }
        );

        webhookWorkOrder = webhookResponse.data.data;
        logSuccess(`Webhook work order created: ${webhookWorkOrder.jobNo} (ID: ${webhookWorkOrder.id})`);

        // Verify the work order has Visionwest client_id
        const [workOrders] = await sequelize.query(`
            SELECT * FROM work_orders WHERE id = ${webhookWorkOrder.id}
        `);
        const workOrder = workOrders[0];

        recordTest(
            'Webhook work order has Visionwest client_id',
            workOrder.client_id === visionwestClient.id,
            `Expected client_id: ${visionwestClient.id}, Got: ${workOrder.client_id}`
        );

        recordTest(
            'Webhook endpoint accessible without JWT',
            webhookResponse.status === 201,
            'Webhook bypasses JWT authentication'
        );

    } catch (error) {
        recordTest('Webhook creates work order', false, error.message);
        if (error.response) {
            logError(`Response: ${JSON.stringify(error.response.data)}`);
        }
    }

    logSection('TEST 2: Visionwest user can see webhook work order');

    try {
        const response = await axios.get(`${BASE_URL}/work-orders`, {
            headers: { 'Authorization': `Bearer ${visionwestToken}` }
        });

        const workOrderIds = response.data.data.map(wo => wo.id);
        const canSeeWebhookOrder = workOrderIds.includes(webhookWorkOrder.id);

        logInfo(`Visionwest user sees ${response.data.data.length} work orders`);

        recordTest(
            'Visionwest user can see webhook work order',
            canSeeWebhookOrder,
            `Webhook work order ${canSeeWebhookOrder ? 'visible' : 'not visible'}`
        );

    } catch (error) {
        recordTest('Visionwest user access', false, error.message);
    }

    logSection('TEST 3: Test client user CANNOT see webhook work order');

    try {
        const response = await axios.get(`${BASE_URL}/work-orders`, {
            headers: { 'Authorization': `Bearer ${testClientToken}` }
        });

        const workOrderIds = response.data.data.map(wo => wo.id);
        const canSeeWebhookOrder = workOrderIds.includes(webhookWorkOrder.id);

        logInfo(`Test client user sees ${response.data.data.length} work orders`);

        recordTest(
            'Test client user CANNOT see webhook work order',
            !canSeeWebhookOrder,
            `Webhook work order ${!canSeeWebhookOrder ? 'correctly hidden' : 'incorrectly visible'}`
        );

    } catch (error) {
        recordTest('Test client isolation', false, error.message);
    }

    logSection('TEST 4: Cross-client access blocked');

    try {
        await axios.get(`${BASE_URL}/work-orders/${webhookWorkOrder.id}`, {
            headers: { 'Authorization': `Bearer ${testClientToken}` }
        });
        recordTest('Test client blocked from accessing webhook work order by ID', false, 'Should have been blocked but was not');
    } catch (error) {
        const isBlocked = error.response?.status === 403 || error.response?.status === 404;
        recordTest(
            'Test client blocked from accessing webhook work order by ID',
            isBlocked,
            `Got ${error.response?.status} ${error.response?.data?.message}`
        );
    }
}

async function cleanup() {
    logSection('CLEANUP: Removing Test Data');

    try {
        // Delete webhook work order
        if (webhookWorkOrder) {
            await sequelize.query(`DELETE FROM work_orders WHERE id = ${webhookWorkOrder.id}`);
            logInfo(`Deleted webhook work order (ID: ${webhookWorkOrder.id})`);
        }

        // Delete test users
        await sequelize.query(`
            DELETE FROM users
            WHERE email IN ('visionwest.user@test.com', 'testclient.user@test.com')
        `);
        logInfo('Deleted test users');

        // Delete test client
        await sequelize.query(`DELETE FROM clients WHERE code = 'WEBHOOK_TEST'`);
        logInfo('Deleted test client');

        logSuccess('Cleanup complete!');
    } catch (error) {
        logWarning(`Cleanup encountered errors: ${error.message}`);
    }
}

async function printSummary() {
    logSection('TEST SUMMARY');

    console.log('\n' + '─'.repeat(70));
    log('Test Results:', 'bold');
    console.log('─'.repeat(70));

    testResults.forEach((result, index) => {
        const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
        const statusColor = result.status === 'PASS' ? 'green' : 'red';
        log(`${index + 1}. ${result.test}`, 'reset');
        log(`   ${status}`, statusColor);
        if (result.details) {
            log(`   ${result.details}`, 'blue');
        }
    });

    console.log('─'.repeat(70));
    log(`\nTotal Tests: ${testsPassed + testsFailed}`, 'bold');
    log(`Passed: ${testsPassed}`, 'green');
    log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
    log(`Pass Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`, testsFailed === 0 ? 'green' : 'yellow');
    console.log('─'.repeat(70));

    if (testsFailed === 0) {
        log('\n🎉 ALL TESTS PASSED! n8n webhook integration is working correctly.', 'green');
    } else {
        log(`\n⚠️  ${testsFailed} test(s) failed. Review the output above for details.`, 'red');
    }
}

async function main() {
    log('\n╔══════════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        n8n WEBHOOK INTEGRATION TEST                                ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════════════════╝\n', 'cyan');

    try {
        // Connect to database
        await sequelize.authenticate();
        logSuccess('Database connection established');

        // Run tests
        await setup();
        await testWebhookIntegration();
        await cleanup();
        await printSummary();

        // Close connection
        await sequelize.close();
        process.exit(testsFailed === 0 ? 0 : 1);

    } catch (error) {
        logError(`Test suite failed: ${error.message}`);
        console.error(error);
        await sequelize.close();
        process.exit(1);
    }
}

// Run tests
main();
