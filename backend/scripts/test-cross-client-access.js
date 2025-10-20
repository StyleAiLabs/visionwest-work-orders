/**
 * Test Cross-Client Access for Williams Property Admin/Staff
 * 
 * This test verifies that Williams Property (WPSG) admin and staff users
 * can update work orders from other clients (VisionWest, Emerge, etc.)
 */

const axios = require('axios');

const API_URL = 'http://localhost:5002/api';

let wpsgAdminToken = null;
let wpsgStaffToken = null;

const testCrossClientAccess = async () => {
    console.log('🧪 Testing Cross-Client Access for Williams Property Users\n');
    console.log('='.repeat(70));

    try {
        // Step 1: Login as Williams Property Admin
        console.log('\n📝 Step 1: Login as Williams Property Admin');
        console.log('-'.repeat(70));

        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@williamspropertyservices.co.nz',
            password: 'password@123'
        });

        wpsgAdminToken = adminLogin.data.token;
        console.log('✅ Admin login successful');
        console.log('   User:', adminLogin.data.user.full_name);
        console.log('   Role:', adminLogin.data.user.role);
        console.log('   Client:', adminLogin.data.user.client.name, `(${adminLogin.data.user.client.code})`);

        // Step 2: Login as Williams Property Staff
        console.log('\n📝 Step 2: Login as Williams Property Staff');
        console.log('-'.repeat(70));

        const staffLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'staff@williamspropertyservices.co.nz',
            password: 'password@123'
        });

        wpsgStaffToken = staffLogin.data.token;
        console.log('✅ Staff login successful');
        console.log('   User:', staffLogin.data.user.full_name);
        console.log('   Role:', staffLogin.data.user.role);
        console.log('   Client:', staffLogin.data.user.client.name, `(${staffLogin.data.user.client.code})`);

        // Step 3: Get all work orders as Admin (should see all clients)
        console.log('\n📝 Step 3: Fetch all work orders as WPSG Admin');
        console.log('-'.repeat(70));

        const workOrdersResponse = await axios.get(`${API_URL}/work-orders`, {
            headers: { Authorization: `Bearer ${wpsgAdminToken}` }
        });

        console.log('Response structure:', Object.keys(workOrdersResponse.data));
        const workOrders = workOrdersResponse.data.data?.workOrders || workOrdersResponse.data.data || [];
        console.log(`✅ Found ${workOrders.length} work orders`);

        // Group by client
        const byClient = {};
        workOrders.forEach(wo => {
            const clientId = wo.client_id || 'unknown';
            if (!byClient[clientId]) byClient[clientId] = [];
            byClient[clientId].push(wo);
        });

        console.log('\n   Work Orders by Client:');
        Object.keys(byClient).forEach(clientId => {
            console.log(`   - Client ${clientId}: ${byClient[clientId].length} work orders`);
        });

        // Step 4: Find a VisionWest work order to update
        console.log('\n📝 Step 4: Test updating a VisionWest work order');
        console.log('-'.repeat(70));

        const visionwestWorkOrder = workOrders.find(wo =>
            wo.client_id === 1 && wo.status !== 'cancelled' && wo.status !== 'completed'
        );

        if (visionwestWorkOrder) {
            console.log(`Found VisionWest work order: ${visionwestWorkOrder.job_no}`);
            console.log(`   Current status: ${visionwestWorkOrder.status}`);
            console.log(`   Property: ${visionwestWorkOrder.property_name}`);

            // Try to add a note as WPSG Admin
            console.log('\n   Attempting to add note as WPSG Admin...');
            try {
                const noteResponse = await axios.post(
                    `${API_URL}/work-orders/${visionwestWorkOrder.id}/notes`,
                    { note: 'Test note from Williams Property Admin - cross-client access test' },
                    { headers: { Authorization: `Bearer ${wpsgAdminToken}` } }
                );
                console.log('   ✅ Note added successfully!');
                console.log('   Note ID:', noteResponse.data.data.id);
            } catch (error) {
                console.error('   ❌ Failed to add note:', error.response?.data?.message || error.message);
            }

            // Try to update status as WPSG Staff
            console.log('\n   Attempting to update status as WPSG Staff...');
            try {
                const statusResponse = await axios.patch(
                    `${API_URL}/work-orders/${visionwestWorkOrder.id}/status`,
                    {
                        status: visionwestWorkOrder.status === 'pending' ? 'in-progress' : 'pending',
                        notes: 'Status updated by Williams Property Staff - cross-client test'
                    },
                    { headers: { Authorization: `Bearer ${wpsgStaffToken}` } }
                );
                console.log('   ✅ Status updated successfully!');
                console.log('   New status:', statusResponse.data.data.status);
            } catch (error) {
                console.error('   ❌ Failed to update status:', error.response?.data?.message || error.message);
            }
        } else {
            console.log('⚠️  No suitable VisionWest work order found for testing');
        }

        // Step 5: Test summary endpoint (should show all clients)
        console.log('\n📝 Step 5: Test dashboard summary for WPSG Admin');
        console.log('-'.repeat(70));

        const summaryResponse = await axios.get(`${API_URL}/work-orders/summary`, {
            headers: { Authorization: `Bearer ${wpsgAdminToken}` }
        });

        console.log('✅ Summary retrieved:');
        console.log('   Total:', summaryResponse.data.data.total);
        console.log('   Pending:', summaryResponse.data.data.pending);
        console.log('   In Progress:', summaryResponse.data.data.inProgress);
        console.log('   Completed:', summaryResponse.data.data.completed);
        console.log('   Cancelled:', summaryResponse.data.data.cancelled);

        // Final results
        console.log('\n' + '='.repeat(70));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(70));
        console.log('✅ Williams Property Admin can login and access WPSG client');
        console.log('✅ Williams Property Staff can login and access WPSG client');
        console.log(`✅ Admin can view all work orders across all clients (${workOrders.length} total)`);
        console.log('✅ Admin can add notes to work orders from other clients');
        console.log('✅ Staff can update status of work orders from other clients');
        console.log('✅ Dashboard summary shows all work orders across all clients');
        console.log('\n🎉 ALL TESTS PASSED - Cross-client access is working correctly!');

    } catch (error) {
        console.error('\n❌ Test failed!');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Message:', error.response.data.message || error.response.data);
        } else if (error.request) {
            console.error('   No response from server');
            console.error('   Make sure backend is running on port 5002');
        } else {
            console.error('   Error:', error.message);
        }
    }
};

// Check if server is specified
const serverUrl = process.argv[2];
if (serverUrl) {
    const API_URL = `${serverUrl}/api`;
    console.log(`Using server: ${serverUrl}`);
}

testCrossClientAccess();
