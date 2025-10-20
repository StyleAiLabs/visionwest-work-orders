/**
 * Test Login for Williams Property Admin
 * Tests the login endpoint with the admin@williamspropertyservices.co.nz user
 */

const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('🧪 Testing Williams Property Admin Login...\n');

        const API_URL = 'http://localhost:5002/api/auth/login';
        
        const credentials = {
            email: 'admin@williamspropertyservices.co.nz',
            password: 'password@123'
        };

        console.log('Credentials:');
        console.log('  Email:', credentials.email);
        console.log('  Password:', credentials.password);
        console.log('\nEndpoint:', API_URL);
        console.log('\n📤 Sending login request...');

        const response = await axios.post(API_URL, credentials);

        console.log('\n✅ Login successful!');
        console.log('\n📊 Response:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.user && response.data.user.client) {
            console.log('\n🏢 Client Information:');
            console.log('  Client ID:', response.data.user.client.id);
            console.log('  Client Name:', response.data.user.client.name);
            console.log('  Client Code:', response.data.user.client.code);
            
            if (response.data.user.client.code === 'WPSG') {
                console.log('\n✅ ✅ SUCCESS! User is correctly assigned to WPSG client!');
            } else {
                console.log('\n❌ FAIL: User is NOT assigned to WPSG client');
                console.log('   Expected: WPSG');
                console.log('   Got:', response.data.user.client.code);
            }
        }

        console.log('\n📝 Token preview:', response.data.token.substring(0, 50) + '...');

    } catch (error) {
        console.error('\n❌ Login failed!');
        
        if (error.response) {
            console.error('\n📛 Error Response:');
            console.error('  Status:', error.response.status);
            console.error('  Message:', error.response.data.message || error.response.data);
            console.error('\n  Full response:');
            console.error(JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('\n📛 No response received from server');
            console.error('  Make sure the backend server is running on port 5002');
            console.error('  Run: npm run dev');
        } else {
            console.error('\n📛 Error:', error.message);
        }
    }
};

testLogin();
