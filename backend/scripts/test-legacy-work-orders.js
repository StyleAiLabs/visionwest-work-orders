/**
 * Test Script: Legacy Work Order Access
 *
 * Purpose: Verify that existing Visionwest users can access work orders
 * after migration and that client scoping is working correctly.
 *
 * Tests:
 * 1. Legacy user can list work orders
 * 2. All returned work orders belong to VISIONWEST client
 * 3. User can access individual work order by ID
 * 4. Work order objects include client_id field
 *
 * Usage:
 *   node backend/scripts/test-legacy-work-orders.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';

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

let authToken = null;

async function loginAsLegacyUser() {
    logSection('SETUP: Login as Legacy Visionwest User');

    try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'legacy.test@visionwest.com',
            password: 'password123'
        });

        const { token, user } = loginResponse.data;
        authToken = token;

        logSuccess(`Logged in as: ${user.email} (client_id: ${user.client_id})`);

        return true;
    } catch (error) {
        logError(`Login failed: ${error.message}`);
        if (error.response) {
            logError(`Response: ${JSON.stringify(error.response.data)}`);
        }
        return false;
    }
}

async function testListWorkOrders() {
    logSection('TEST 1: Legacy User Can List Work Orders');

    try {
        const response = await axios.get(`${BASE_URL}/work-orders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const workOrders = response.data.data;

        recordTest(
            'User can list work orders',
            response.status === 200 && Array.isArray(workOrders),
            `Status: ${response.status}, Count: ${workOrders.length}`
        );

        logInfo(`Found ${workOrders.length} work orders`);

        return workOrders;
    } catch (error) {
        recordTest('User can list work orders', false, error.message);
        if (error.response) {
            logError(`Response: ${JSON.stringify(error.response.data)}`);
        }
        return [];
    }
}

async function testClientScoping(workOrders) {
    logSection('TEST 2: All Work Orders Belong to VISIONWEST Client');

    try {
        if (workOrders.length === 0) {
            logInfo('No work orders to check - skipping client scoping test');
            return;
        }

        const allBelongToVisionwest = workOrders.every(wo => wo.client_id === 1);
        const clientIds = [...new Set(workOrders.map(wo => wo.client_id))];

        recordTest(
            'All work orders belong to VISIONWEST (client_id: 1)',
            allBelongToVisionwest,
            `Unique client_ids found: [${clientIds.join(', ')}]`
        );

        if (!allBelongToVisionwest) {
            logError('Found work orders with different client_ids!');
            workOrders.forEach(wo => {
                if (wo.client_id !== 1) {
                    logError(`  - Work Order ID ${wo.id}: client_id=${wo.client_id}`);
                }
            });
        }
    } catch (error) {
        recordTest('Client scoping check', false, error.message);
    }
}

async function testWorkOrderFields(workOrders) {
    logSection('TEST 3: Work Order Objects Include client_id Field');

    try {
        if (workOrders.length === 0) {
            logInfo('No work orders to check - skipping field test');
            return;
        }

        const allHaveClientId = workOrders.every(wo => wo.hasOwnProperty('client_id') && wo.client_id !== null);

        recordTest(
            'All work orders have client_id field',
            allHaveClientId,
            `Checked ${workOrders.length} work orders`
        );

        // Check first work order structure
        if (workOrders.length > 0) {
            logInfo('Sample work order structure:');
            const sample = workOrders[0];
            logInfo(`  - ID: ${sample.id}`);
            logInfo(`  - Job No: ${sample.jobNo || sample.job_no}`);
            logInfo(`  - client_id: ${sample.client_id}`);
            logInfo(`  - Status: ${sample.status}`);
            logInfo(`  - Created: ${sample.createdAt || sample.created_at}`);
        }
    } catch (error) {
        recordTest('Work order fields check', false, error.message);
    }
}

async function testIndividualWorkOrderAccess(workOrders) {
    logSection('TEST 4: User Can Access Individual Work Order by ID');

    try {
        if (workOrders.length === 0) {
            logInfo('No work orders to test - skipping individual access test');
            return;
        }

        const testWorkOrder = workOrders[0];
        logInfo(`Testing access to work order ID: ${testWorkOrder.id}`);

        const response = await axios.get(`${BASE_URL}/work-orders/${testWorkOrder.id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const workOrder = response.data.data;

        recordTest(
            'User can access individual work order',
            response.status === 200 && workOrder.id === testWorkOrder.id,
            `Accessed work order ${workOrder.id} (client_id: ${workOrder.client_id})`
        );

        recordTest(
            'Individual work order has correct client_id',
            workOrder.client_id === 1,
            `client_id: ${workOrder.client_id}`
        );

    } catch (error) {
        recordTest('Individual work order access', false, error.message);
        if (error.response) {
            logError(`Response: ${JSON.stringify(error.response.data)}`);
        }
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
        log('\n🎉 ALL TESTS PASSED! Legacy work order access is working correctly.', 'green');
        log('✅ Legacy users can access their work orders', 'green');
        log('✅ Client scoping is enforcing data isolation', 'green');
        log('✅ All work orders properly assigned to VISIONWEST client', 'green');
    } else {
        log(`\n⚠️  ${testsFailed} test(s) failed. Review the output above for details.`, 'red');
    }
}

async function main() {
    log('\n╔══════════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        LEGACY WORK ORDER ACCESS TEST (Multi-Client Migration)     ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════════════════╝\n', 'cyan');

    try {
        // Run tests
        const loginSuccess = await loginAsLegacyUser();

        if (!loginSuccess) {
            logError('Could not proceed with tests - login failed');
            process.exit(1);
        }

        const workOrders = await testListWorkOrders();
        await testClientScoping(workOrders);
        await testWorkOrderFields(workOrders);
        await testIndividualWorkOrderAccess(workOrders);

        await printSummary();

        process.exit(testsFailed === 0 ? 0 : 1);

    } catch (error) {
        logError(`Test suite failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run tests
main();
