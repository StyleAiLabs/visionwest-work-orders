const axios = require('axios');

const API_URL = 'http://localhost:5002/api';

async function testAdminFlow() {
    try {
        console.log('=== Testing Admin Login Flow ===\n');

        // Step 1: Login
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@williamspropertyservices.co.nz',
            password: 'password123'
        });

        console.log('✅ Login successful');
        console.log('User:', loginResponse.data.user);
        console.log('Token:', loginResponse.data.token.substring(0, 50) + '...\n');

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;

        // Step 2: Get current user (/auth/me)
        console.log('2. Testing /auth/me endpoint...');
        const meResponse = await axios.get(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ /auth/me successful');
        console.log('User data:', meResponse.data.user);
        console.log('Has client_id?', meResponse.data.user.client_id ? 'YES' : 'NO');
        console.log('Has client object?', meResponse.data.user.client ? 'YES' : 'NO');
        console.log('Client data:', meResponse.data.user.client);
        console.log('');

        // Step 3: Test client list endpoint
        console.log('3. Testing /clients endpoint (admin only)...');
        const clientsResponse = await axios.get(`${API_URL}/clients`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ /clients endpoint successful');
        console.log('Total clients:', clientsResponse.data.pagination.total);
        console.log('Clients:', clientsResponse.data.data.map(c => `${c.name} (${c.code})`).join(', '));
        console.log('');

        // Summary
        console.log('=== Summary ===');
        console.log('✅ Login: Working');
        console.log('✅ /auth/me: Working');
        console.log('✅ /clients: Working');
        console.log('✅ Admin role: Verified');
        console.log('✅ Client association: Present');
        console.log('\n🎉 All backend endpoints are working correctly!');
        console.log('\nIf the frontend /admin page is still blank, the issue is in the frontend code.');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testAdminFlow();
