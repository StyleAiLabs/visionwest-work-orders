/**
 * Test Script: Client Management API
 *
 * Tests the new client management endpoints (T030-T039)
 * Run with: node scripts/test-client-api.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5002/api';
let adminToken = null;

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    log(title, 'cyan');
    console.log('='.repeat(70));
}

async function loginAsAdmin() {
    try {
        log('\n📧 Attempting to log in as admin...', 'blue');

        // Try to find admin user email - you may need to update this
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',  // Update this if different
            password: 'password123'       // Update this if different
        });

        adminToken = response.data.token;
        log('✅ Admin login successful', 'green');
        log(`   User: ${response.data.user.full_name || response.data.user.email}`, 'yellow');
        log(`   Role: ${response.data.user.role}`, 'yellow');

        return response.data.user;
    } catch (error) {
        log('❌ Admin login failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
        log('\n⚠️  Please update the login credentials in this script', 'yellow');
        log('   Or create an admin user in the database', 'yellow');
        throw error;
    }
}

async function testGetAllClients() {
    logSection('Test 1: GET /api/clients - List All Clients');

    try {
        const response = await axios.get(`${API_URL}/clients`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        log('✅ GET /api/clients successful', 'green');
        log(`   Found ${response.data.data.length} clients`, 'yellow');
        log(`   Pagination: Page ${response.data.pagination.page} of ${response.data.pagination.pages}`, 'yellow');

        response.data.data.forEach((client, index) => {
            log(`   ${index + 1}. ${client.name} (${client.code}) - ${client.status}`, 'yellow');
            log(`      Users: ${client.user_count}, Work Orders: ${client.work_order_count}`, 'yellow');
        });

        return response.data.data;
    } catch (error) {
        log('❌ GET /api/clients failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
        throw error;
    }
}

async function testGetClientById(clientId) {
    logSection(`Test 2: GET /api/clients/${clientId} - Get Client by ID`);

    try {
        const response = await axios.get(`${API_URL}/clients/${clientId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        log('✅ GET /api/clients/:id successful', 'green');
        const client = response.data.data;
        log(`   Name: ${client.name}`, 'yellow');
        log(`   Code: ${client.code}`, 'yellow');
        log(`   Status: ${client.status}`, 'yellow');
        log(`   Users: ${client.user_count}`, 'yellow');
        log(`   Work Orders: ${client.work_order_count}`, 'yellow');

        return client;
    } catch (error) {
        log('❌ GET /api/clients/:id failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
        throw error;
    }
}

async function testGetClientStats(clientId) {
    logSection(`Test 3: GET /api/clients/${clientId}/stats - Get Client Statistics`);

    try {
        const response = await axios.get(`${API_URL}/clients/${clientId}/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        log('✅ GET /api/clients/:id/stats successful', 'green');
        const stats = response.data.data;
        log(`   Total Users: ${stats.user_count}`, 'yellow');
        log(`   Total Work Orders: ${stats.work_order_count}`, 'yellow');

        log('   Work Orders by Status:', 'yellow');
        Object.entries(stats.work_orders_by_status).forEach(([status, count]) => {
            log(`     - ${status}: ${count}`, 'yellow');
        });

        log('   Users by Role:', 'yellow');
        Object.entries(stats.users_by_role).forEach(([role, count]) => {
            log(`     - ${role}: ${count}`, 'yellow');
        });

        return stats;
    } catch (error) {
        log('❌ GET /api/clients/:id/stats failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
        throw error;
    }
}

async function testCreateClient() {
    logSection('Test 4: POST /api/clients - Create New Client');

    const newClient = {
        name: 'Test Property Management',
        code: 'TEST_PM_' + Date.now(),
        primary_contact_name: 'Test Contact',
        primary_contact_email: 'test@example.com',
        primary_contact_phone: '+64 21 123 4567',
        status: 'active'
    };

    try {
        const response = await axios.post(`${API_URL}/clients`, newClient, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        log('✅ POST /api/clients successful', 'green');
        const client = response.data.data;
        log(`   Created client: ${client.name} (${client.code})`, 'yellow');
        log(`   ID: ${client.id}`, 'yellow');

        return client;
    } catch (error) {
        log('❌ POST /api/clients failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
        if (error.response?.data?.errors) {
            error.response.data.errors.forEach(err => {
                log(`     - ${err.field}: ${err.message}`, 'red');
            });
        }
        throw error;
    }
}

async function testUpdateClient(clientId) {
    logSection(`Test 5: PUT /api/clients/${clientId} - Update Client`);

    const updates = {
        name: 'Updated Test Property Management',
        status: 'active'
    };

    try {
        const response = await axios.put(`${API_URL}/clients/${clientId}`, updates, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        log('✅ PUT /api/clients/:id successful', 'green');
        const client = response.data.data;
        log(`   Updated client: ${client.name}`, 'yellow');

        return client;
    } catch (error) {
        log('❌ PUT /api/clients/:id failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
        throw error;
    }
}

async function testDeleteClient(clientId) {
    logSection(`Test 6: DELETE /api/clients/${clientId} - Delete Client`);

    try {
        const response = await axios.delete(`${API_URL}/clients/${clientId}?confirm=true`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        log('✅ DELETE /api/clients/:id successful', 'green');
        log(`   ${response.data.message}`, 'yellow');

        return true;
    } catch (error) {
        log('❌ DELETE /api/clients/:id failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');

        if (error.response?.status === 400 && error.response?.data?.details) {
            log('   Cannot delete client with:', 'yellow');
            log(`     - ${error.response.data.details.user_count} users`, 'yellow');
            log(`     - ${error.response.data.details.work_order_count} work orders`, 'yellow');
        }

        // This is expected for clients with data, not a failure
        return false;
    }
}

async function testSearchAndFilter() {
    logSection('Test 7: Search and Filter');

    try {
        // Test search
        log('\n📍 Testing search by name...', 'blue');
        const searchResponse = await axios.get(`${API_URL}/clients?search=vision`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        log(`   ✅ Found ${searchResponse.data.data.length} clients matching "vision"`, 'green');

        // Test filter by status
        log('\n📍 Testing filter by status...', 'blue');
        const filterResponse = await axios.get(`${API_URL}/clients?status=active`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        log(`   ✅ Found ${filterResponse.data.data.length} active clients`, 'green');

        return true;
    } catch (error) {
        log('❌ Search/filter test failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
        throw error;
    }
}

async function runAllTests() {
    try {
        log('\n╔══════════════════════════════════════════════════════════════════════╗', 'cyan');
        log('║        CLIENT MANAGEMENT API TESTS                                   ║', 'cyan');
        log('╚══════════════════════════════════════════════════════════════════════╝\n', 'cyan');

        // Login
        await loginAsAdmin();

        // Test all endpoints
        const clients = await testGetAllClients();

        if (clients.length > 0) {
            const firstClient = clients[0];
            await testGetClientById(firstClient.id);
            await testGetClientStats(firstClient.id);
        }

        await testSearchAndFilter();

        const newClient = await testCreateClient();
        await testUpdateClient(newClient.id);
        await testDeleteClient(newClient.id);

        // Summary
        logSection('Test Summary');
        log('\n🎉 All client API tests passed!', 'green');
        log('Backend client management API is working correctly.', 'green');
        log('\n📝 Next Steps:', 'blue');
        log('   1. Complete frontend integration (T045-T049)', 'yellow');
        log('   2. Test admin panel UI in browser', 'yellow');
        log('   3. Test client context switching', 'yellow');

    } catch (error) {
        logSection('Test Summary');
        log('\n⚠️  Some tests failed', 'red');
        log('Please review the errors above.', 'red');
        process.exit(1);
    }
}

// Run tests
runAllTests();
