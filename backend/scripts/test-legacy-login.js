/**
 * Test Script: Legacy User Login with Multi-Client Support
 *
 * Purpose: Verify that existing Visionwest users can log in after migration
 * and receive JWT tokens with clientId and clientCode claims.
 *
 * Tests:
 * 1. Legacy Visionwest user can log in
 * 2. JWT token contains clientId claim
 * 3. JWT token contains clientCode claim (VISIONWEST)
 * 4. User object includes client information
 *
 * Usage:
 *   node backend/scripts/test-legacy-login.js
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

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

async function testLegacyUserLogin() {
    logSection('TEST 1: Legacy Visionwest User Can Login');

    try {
        // Attempt to log in with a test user
        // Note: This assumes a test user exists. If not, we'll create one first.

        logInfo('Attempting to log in with test credentials...');

        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'legacy.test@visionwest.com',
            password: 'password123'
        });

        const { token, user } = loginResponse.data;

        recordTest(
            'User can log in successfully',
            !!token && !!user,
            `Token received: ${!!token}, User data: ${!!user}`
        );

        logInfo(`Logged in as: ${user.email} (ID: ${user.id})`);

        return { token, user };
    } catch (error) {
        recordTest('User can log in successfully', false, error.message);
        if (error.response) {
            logError(`Response: ${JSON.stringify(error.response.data)}`);
        }
        return null;
    }
}

async function testTokenClaims(token, user) {
    logSection('TEST 2: JWT Token Contains Client Claims');

    try {
        // Decode token without verification (just to inspect claims)
        const decoded = jwt.decode(token);

        logInfo('Token claims:');
        console.log(JSON.stringify(decoded, null, 2));

        // Check for clientId claim
        recordTest(
            'Token contains clientId claim',
            decoded.hasOwnProperty('clientId') && decoded.clientId !== null,
            decoded.clientId ? `clientId: ${decoded.clientId}` : 'clientId missing or null'
        );

        // Check for clientCode claim
        recordTest(
            'Token contains clientCode claim',
            decoded.hasOwnProperty('clientCode') && decoded.clientCode === 'VISIONWEST',
            decoded.clientCode ? `clientCode: ${decoded.clientCode}` : 'clientCode missing'
        );

        // Check userId claim matches user
        recordTest(
            'Token userId matches user ID',
            decoded.userId === user.id,
            `Token userId: ${decoded.userId}, User ID: ${user.id}`
        );

        // Check for role claim
        recordTest(
            'Token contains role claim',
            decoded.hasOwnProperty('role') && decoded.role !== null,
            decoded.role ? `role: ${decoded.role}` : 'role missing'
        );

        return decoded;
    } catch (error) {
        recordTest('JWT token decode', false, error.message);
        return null;
    }
}

async function testUserClientInfo(user) {
    logSection('TEST 3: User Object Contains Client Information');

    try {
        // Check user has client_id
        recordTest(
            'User object contains client_id',
            user.hasOwnProperty('client_id') && user.client_id !== null,
            user.client_id ? `client_id: ${user.client_id}` : 'client_id missing or null'
        );

        // Check user has clientCode
        recordTest(
            'User object contains clientCode',
            user.hasOwnProperty('clientCode'),
            user.clientCode ? `clientCode: ${user.clientCode}` : 'clientCode missing'
        );

        logInfo(`User client info: client_id=${user.client_id}, clientCode=${user.clientCode}`);
    } catch (error) {
        recordTest('User client information', false, error.message);
    }
}

async function testAuthenticatedRequest(token) {
    logSection('TEST 4: Authenticated Request with JWT Token');

    try {
        // Make an authenticated request to get current user
        const response = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const userData = response.data;

        recordTest(
            'Authenticated request succeeds',
            response.status === 200 && userData.success,
            `Status: ${response.status}`
        );

        recordTest(
            'Current user data includes client info',
            userData.data.client_id !== null,
            `client_id: ${userData.data.client_id}`
        );

        logInfo(`Current user: ${userData.data.email} (client_id: ${userData.data.client_id})`);
    } catch (error) {
        recordTest('Authenticated request', false, error.message);
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
        log('\n🎉 ALL TESTS PASSED! Legacy user login is working correctly with multi-client support.', 'green');
    } else {
        log(`\n⚠️  ${testsFailed} test(s) failed. Review the output above for details.`, 'red');
    }
}

async function main() {
    log('\n╔══════════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        LEGACY USER LOGIN TEST (Multi-Client Migration)            ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════════════════╝\n', 'cyan');

    try {
        // Run tests
        const loginResult = await testLegacyUserLogin();

        if (loginResult) {
            await testTokenClaims(loginResult.token, loginResult.user);
            await testUserClientInfo(loginResult.user);
            await testAuthenticatedRequest(loginResult.token);
        } else {
            logError('Could not proceed with tests - login failed');
        }

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
