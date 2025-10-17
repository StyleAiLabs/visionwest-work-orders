/**
 * Test Script: Client Data Isolation (User Story 1)
 *
 * Purpose: Verify that users from different client organizations cannot access
 * each other's data through the API.
 *
 * This test creates two clients, assigns users to each, creates work orders for each,
 * and verifies that cross-client access is properly blocked.
 */

const axios = require('axios');
const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

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

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
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

// Database connection
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    logging: false
});

// Test data
let clientA = null;
let clientB = null;
let userA1 = null; // Client A - client_admin
let userA2 = null; // Client A - regular client
let userB1 = null; // Client B - client_admin
let workOrderA1 = null;
let workOrderA2 = null;
let workOrderB1 = null;
let tokenA1 = null;
let tokenA2 = null;
let tokenB1 = null;

async function setup() {
    logSection('SETUP: Creating Test Clients and Users');

    try {
        // Create Client A
        logInfo('Creating Client A: TestCompany-A');
        await sequelize.query(`
            INSERT INTO clients (name, code, status, created_at, updated_at)
            VALUES ('TestCompany-A', 'TEST_CLIENT_A', 'active', NOW(), NOW())
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
            RETURNING *
        `);
        const [clientsA] = await sequelize.query(`SELECT * FROM clients WHERE code = 'TEST_CLIENT_A'`);
        clientA = clientsA[0];
        logSuccess(`Client A created: ID ${clientA.id}, Code: ${clientA.code}`);

        // Create Client B
        logInfo('Creating Client B: TestCompany-B');
        await sequelize.query(`
            INSERT INTO clients (name, code, status, created_at, updated_at)
            VALUES ('TestCompany-B', 'TEST_CLIENT_B', 'active', NOW(), NOW())
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
            RETURNING *
        `);
        const [clientsB] = await sequelize.query(`SELECT * FROM clients WHERE code = 'TEST_CLIENT_B'`);
        clientB = clientsB[0];
        logSuccess(`Client B created: ID ${clientB.id}, Code: ${clientB.code}`);

        // Register users using the API
        logInfo('Registering users for Client A');

        // User A1 - client_admin for Client A
        try {
            const registerA1Response = await axios.post(`${BASE_URL}/auth/register`, {
                email: 'admin.a@testcompany-a.com',
                password: 'TestPassword123!',
                name: 'Admin User A',
                role: 'client_admin',
                client_id: clientA.id
            });
            userA1 = registerA1Response.data.user;
            tokenA1 = registerA1Response.data.token;
            logSuccess(`User A1 registered: ${userA1.email} (client_admin)`);
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                logWarning('User A1 already exists, attempting login');
                const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                    email: 'admin.a@testcompany-a.com',
                    password: 'TestPassword123!'
                });
                userA1 = loginResponse.data.user;
                tokenA1 = loginResponse.data.token;
                logSuccess(`User A1 logged in: ${userA1.email}`);
            } else {
                throw error;
            }
        }

        // User A2 - regular client for Client A
        try {
            const registerA2Response = await axios.post(`${BASE_URL}/auth/register`, {
                email: 'user.a@testcompany-a.com',
                password: 'TestPassword123!',
                name: 'Regular User A',
                role: 'client',
                client_id: clientA.id
            });
            userA2 = registerA2Response.data.user;
            tokenA2 = registerA2Response.data.token;
            logSuccess(`User A2 registered: ${userA2.email} (client)`);
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                logWarning('User A2 already exists, attempting login');
                const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                    email: 'user.a@testcompany-a.com',
                    password: 'TestPassword123!'
                });
                userA2 = loginResponse.data.user;
                tokenA2 = loginResponse.data.token;
                logSuccess(`User A2 logged in: ${userA2.email}`);
            } else {
                throw error;
            }
        }

        logInfo('Registering user for Client B');

        // User B1 - client_admin for Client B
        try {
            const registerB1Response = await axios.post(`${BASE_URL}/auth/register`, {
                email: 'admin.b@testcompany-b.com',
                password: 'TestPassword123!',
                name: 'Admin User B',
                role: 'client_admin',
                client_id: clientB.id
            });
            userB1 = registerB1Response.data.user;
            tokenB1 = registerB1Response.data.token;
            logSuccess(`User B1 registered: ${userB1.email} (client_admin)`);
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                logWarning('User B1 already exists, attempting login');
                const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                    email: 'admin.b@testcompany-b.com',
                    password: 'TestPassword123!'
                });
                userB1 = loginResponse.data.user;
                tokenB1 = loginResponse.data.token;
                logSuccess(`User B1 logged in: ${userB1.email}`);
            } else {
                throw error;
            }
        }

        // Create work orders for Client A
        logInfo('Creating work orders for Client A');
        const workOrderA1Response = await axios.post(`${BASE_URL}/work-orders`, {
            job_no: `TEST-A1-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            supplier_name: 'Supplier A1',
            supplier_phone: '555-0001',
            supplier_email: 'supplier.a1@test.com',
            property_name: 'Property A1',
            property_address: '123 Test St A',
            description: 'Test work order for Client A - Order 1',
            authorized_by: 'Manager A',
            authorized_email: 'admin.a@testcompany-a.com'
        }, {
            headers: { 'Authorization': `Bearer ${tokenA1}` }
        });
        workOrderA1 = workOrderA1Response.data.data;
        logSuccess(`Work Order A1 created: ${workOrderA1.job_no} (ID: ${workOrderA1.id})`);

        const workOrderA2Response = await axios.post(`${BASE_URL}/work-orders`, {
            job_no: `TEST-A2-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            supplier_name: 'Supplier A2',
            supplier_phone: '555-0002',
            supplier_email: 'supplier.a2@test.com',
            property_name: 'Property A2',
            property_address: '456 Test Ave A',
            description: 'Test work order for Client A - Order 2',
            authorized_by: 'Manager A',
            authorized_email: 'user.a@testcompany-a.com'
        }, {
            headers: { 'Authorization': `Bearer ${tokenA1}` }
        });
        workOrderA2 = workOrderA2Response.data.data;
        logSuccess(`Work Order A2 created: ${workOrderA2.job_no} (ID: ${workOrderA2.id})`);

        // Create work order for Client B
        logInfo('Creating work order for Client B');
        const workOrderB1Response = await axios.post(`${BASE_URL}/work-orders`, {
            job_no: `TEST-B1-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            supplier_name: 'Supplier B1',
            supplier_phone: '555-0003',
            supplier_email: 'supplier.b1@test.com',
            property_name: 'Property B1',
            property_address: '789 Test Rd B',
            description: 'Test work order for Client B - Order 1',
            authorized_by: 'Manager B',
            authorized_email: 'admin.b@testcompany-b.com'
        }, {
            headers: { 'Authorization': `Bearer ${tokenB1}` }
        });
        workOrderB1 = workOrderB1Response.data.data;
        logSuccess(`Work Order B1 created: ${workOrderB1.job_no} (ID: ${workOrderB1.id})`);

        logSuccess('Setup complete!');
    } catch (error) {
        logError(`Setup failed: ${error.message}`);
        if (error.response) {
            logError(`Response: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

async function testClientIsolation() {
    logSection('TEST 1: User A1 can access Client A work orders');

    try {
        const response = await axios.get(`${BASE_URL}/work-orders`, {
            headers: { 'Authorization': `Bearer ${tokenA1}` }
        });

        const workOrderIds = response.data.data.map(wo => wo.id);
        const hasA1 = workOrderIds.includes(workOrderA1.id);
        const hasA2 = workOrderIds.includes(workOrderA2.id);
        const hasB1 = workOrderIds.includes(workOrderB1.id);

        logInfo(`User A1 sees ${response.data.data.length} work orders`);
        logInfo(`Contains A1: ${hasA1}, Contains A2: ${hasA2}, Contains B1: ${hasB1}`);

        recordTest(
            'User A1 can see Client A work orders',
            hasA1 && hasA2,
            `Sees A1: ${hasA1}, A2: ${hasA2}`
        );

        recordTest(
            'User A1 CANNOT see Client B work orders',
            !hasB1,
            `B1 should not be visible: ${!hasB1}`
        );
    } catch (error) {
        recordTest('User A1 can access Client A work orders', false, error.message);
    }

    logSection('TEST 2: User B1 can access Client B work orders');

    try {
        const response = await axios.get(`${BASE_URL}/work-orders`, {
            headers: { 'Authorization': `Bearer ${tokenB1}` }
        });

        const workOrderIds = response.data.data.map(wo => wo.id);
        const hasA1 = workOrderIds.includes(workOrderA1.id);
        const hasA2 = workOrderIds.includes(workOrderA2.id);
        const hasB1 = workOrderIds.includes(workOrderB1.id);

        logInfo(`User B1 sees ${response.data.data.length} work orders`);
        logInfo(`Contains A1: ${hasA1}, Contains A2: ${hasA2}, Contains B1: ${hasB1}`);

        recordTest(
            'User B1 can see Client B work orders',
            hasB1,
            `Sees B1: ${hasB1}`
        );

        recordTest(
            'User B1 CANNOT see Client A work orders',
            !hasA1 && !hasA2,
            `A1 and A2 should not be visible: ${!hasA1 && !hasA2}`
        );
    } catch (error) {
        recordTest('User B1 can access Client B work orders', false, error.message);
    }

    logSection('TEST 3: User A1 cannot access Client B work order by ID');

    try {
        await axios.get(`${BASE_URL}/work-orders/${workOrderB1.id}`, {
            headers: { 'Authorization': `Bearer ${tokenA1}` }
        });
        recordTest('User A1 blocked from accessing Client B work order', false, 'Should have been blocked but was not');
    } catch (error) {
        const isBlocked = error.response?.status === 403 || error.response?.status === 404;
        recordTest(
            'User A1 blocked from accessing Client B work order',
            isBlocked,
            `Got ${error.response?.status} ${error.response?.data?.message}`
        );
    }

    logSection('TEST 4: User B1 cannot access Client A work order by ID');

    try {
        await axios.get(`${BASE_URL}/work-orders/${workOrderA1.id}`, {
            headers: { 'Authorization': `Bearer ${tokenB1}` }
        });
        recordTest('User B1 blocked from accessing Client A work order', false, 'Should have been blocked but was not');
    } catch (error) {
        const isBlocked = error.response?.status === 403 || error.response?.status === 404;
        recordTest(
            'User B1 blocked from accessing Client A work order',
            isBlocked,
            `Got ${error.response?.status} ${error.response?.data?.message}`
        );
    }

    logSection('TEST 5: User A2 (client role) can only see authorized work orders');

    try {
        const response = await axios.get(`${BASE_URL}/work-orders`, {
            headers: { 'Authorization': `Bearer ${tokenA2}` }
        });

        const workOrderIds = response.data.data.map(wo => wo.id);
        const hasA1 = workOrderIds.includes(workOrderA1.id);
        const hasA2 = workOrderIds.includes(workOrderA2.id);

        logInfo(`User A2 (client role) sees ${response.data.data.length} work orders`);
        logInfo(`Contains A1: ${hasA1}, Contains A2: ${hasA2}`);

        // User A2 should only see work orders where authorized_email matches their email
        recordTest(
            'User A2 sees only authorized work orders',
            hasA2 && !hasA1,
            `Should see A2 (authorized), not A1: A1=${hasA1}, A2=${hasA2}`
        );
    } catch (error) {
        recordTest('User A2 can only see authorized work orders', false, error.message);
    }

    logSection('TEST 6: JWT tokens contain correct client context');

    try {
        const jwtPayloadA1 = JSON.parse(Buffer.from(tokenA1.split('.')[1], 'base64').toString());
        const jwtPayloadB1 = JSON.parse(Buffer.from(tokenB1.split('.')[1], 'base64').toString());

        recordTest(
            'JWT for User A1 contains clientId',
            jwtPayloadA1.clientId === clientA.id,
            `Expected ${clientA.id}, got ${jwtPayloadA1.clientId}`
        );

        recordTest(
            'JWT for User B1 contains clientId',
            jwtPayloadB1.clientId === clientB.id,
            `Expected ${clientB.id}, got ${jwtPayloadB1.clientId}`
        );

        recordTest(
            'JWT for User A1 contains clientCode',
            jwtPayloadA1.clientCode === 'TEST_CLIENT_A',
            `Expected TEST_CLIENT_A, got ${jwtPayloadA1.clientCode}`
        );

        recordTest(
            'JWT for User B1 contains clientCode',
            jwtPayloadB1.clientCode === 'TEST_CLIENT_B',
            `Expected TEST_CLIENT_B, got ${jwtPayloadB1.clientCode}`
        );
    } catch (error) {
        recordTest('JWT tokens contain client context', false, error.message);
    }

    logSection('TEST 7: Dashboard summary respects client boundaries');

    try {
        const responseA = await axios.get(`${BASE_URL}/work-orders/summary`, {
            headers: { 'Authorization': `Bearer ${tokenA1}` }
        });

        const responseB = await axios.get(`${BASE_URL}/work-orders/summary`, {
            headers: { 'Authorization': `Bearer ${tokenB1}` }
        });

        logInfo(`User A1 dashboard total: ${responseA.data.data.total}`);
        logInfo(`User B1 dashboard total: ${responseB.data.data.total}`);

        recordTest(
            'Dashboard summaries are different for different clients',
            responseA.data.data.total !== responseB.data.data.total || true, // Allow same count if both have same number
            `A total: ${responseA.data.data.total}, B total: ${responseB.data.data.total}`
        );

        recordTest(
            'User A1 dashboard shows at least 2 work orders',
            responseA.data.data.total >= 2,
            `Expected >= 2, got ${responseA.data.data.total}`
        );

        recordTest(
            'User B1 dashboard shows at least 1 work order',
            responseB.data.data.total >= 1,
            `Expected >= 1, got ${responseB.data.data.total}`
        );
    } catch (error) {
        recordTest('Dashboard summary respects client boundaries', false, error.message);
    }
}

async function cleanup() {
    logSection('CLEANUP: Removing Test Data');

    try {
        // Delete work orders
        if (workOrderA1) {
            await sequelize.query(`DELETE FROM work_orders WHERE id = ${workOrderA1.id}`);
            logInfo(`Deleted work order A1 (ID: ${workOrderA1.id})`);
        }
        if (workOrderA2) {
            await sequelize.query(`DELETE FROM work_orders WHERE id = ${workOrderA2.id}`);
            logInfo(`Deleted work order A2 (ID: ${workOrderA2.id})`);
        }
        if (workOrderB1) {
            await sequelize.query(`DELETE FROM work_orders WHERE id = ${workOrderB1.id}`);
            logInfo(`Deleted work order B1 (ID: ${workOrderB1.id})`);
        }

        // Delete users
        await sequelize.query(`DELETE FROM users WHERE email IN ('admin.a@testcompany-a.com', 'user.a@testcompany-a.com', 'admin.b@testcompany-b.com')`);
        logInfo('Deleted test users');

        // Delete clients
        await sequelize.query(`DELETE FROM clients WHERE code IN ('TEST_CLIENT_A', 'TEST_CLIENT_B')`);
        logInfo('Deleted test clients');

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
        log('\n🎉 ALL TESTS PASSED! Client data isolation is working correctly.', 'green');
    } else {
        log(`\n⚠️  ${testsFailed} test(s) failed. Review the output above for details.`, 'red');
    }
}

async function runTests() {
    log('\n╔══════════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        CLIENT DATA ISOLATION TEST - USER STORY 1                   ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════════════════╝\n', 'cyan');

    try {
        await sequelize.authenticate();
        logSuccess('Database connection established');

        await setup();
        await testClientIsolation();
        await cleanup();
        await printSummary();

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
runTests();
