/**
 * Check all WPSG users in the database
 * Usage: node scripts/check-wpsg-users.js
 */

require('dotenv').config();
const db = require('../models');
const User = db.user;
const Client = db.client;

async function checkWPSGUsers() {
    try {
        console.log('\n🔍 Checking WPSG Client and Users...\n');

        // First, verify WPSG client exists
        const wpsgClient = await Client.findOne({
            where: { code: 'WPSG' }
        });

        if (!wpsgClient) {
            console.log('❌ WPSG client not found in database');
            console.log('   Run: node scripts/create-wpsg-client.js');
            process.exit(1);
        }

        console.log('✓ WPSG Client found:');
        console.log(`  ID: ${wpsgClient.id}`);
        console.log(`  Name: ${wpsgClient.name}`);
        console.log(`  Code: ${wpsgClient.code}\n`);

        // Find all users with client_id = WPSG client ID
        const wpsgUsers = await User.findAll({
            where: { client_id: wpsgClient.id },
            order: [['id', 'ASC']]
        });

        if (wpsgUsers.length === 0) {
            console.log('❌ No users found with client_id = ' + wpsgClient.id);
            console.log('   No WPSG staff users exist in database');
        } else {
            console.log(`✓ Found ${wpsgUsers.length} WPSG users:\n`);
            console.table(wpsgUsers.map(u => ({
                ID: u.id,
                Name: u.full_name,
                Email: u.email,
                Role: u.role,
                Active: u.is_active,
                Client_ID: u.client_id
            })));
        }

        // Check if user ID 3 specifically exists
        console.log('\n--- Checking User ID 3 Specifically ---');
        const user3 = await User.findOne({
            where: { id: 3 }
        });

        if (!user3) {
            console.log('❌ User ID 3 does not exist in database');
        } else {
            console.log('✓ User ID 3 found:');
            console.log(`  Name: ${user3.full_name}`);
            console.log(`  Email: ${user3.email}`);
            console.log(`  Role: ${user3.role}`);
            console.log(`  Client ID: ${user3.client_id}`);
            console.log(`  Is Active: ${user3.is_active}`);

            if (user3.client_id === wpsgClient.id) {
                console.log('  ✅ User ID 3 BELONGS to WPSG');
            } else {
                console.log(`  ❌ User ID 3 does NOT belong to WPSG (belongs to client_id: ${user3.client_id})`);
            }
        }

        console.log('\n✅ Check complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.sequelize.close();
        process.exit(0);
    }
}

checkWPSGUsers();
