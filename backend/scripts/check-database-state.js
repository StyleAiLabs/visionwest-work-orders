/**
 * Check Database State - Clients and Users
 * Use this to verify the current state before and after WPSG setup
 */

const db = require('../models');

const checkDatabaseState = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // 1. Check all clients
        console.log('=== CLIENTS ===');
        const clients = await db.client.findAll({
            attributes: ['id', 'name', 'code', 'status', 'primary_contact_email'],
            order: [['id', 'ASC']]
        });

        if (clients.length === 0) {
            console.log('❌ No clients found in database!');
        } else {
            console.table(clients.map(c => ({
                ID: c.id,
                Name: c.name,
                Code: c.code,
                Status: c.status,
                Contact: c.primary_contact_email
            })));
        }

        // 2. Check all users with their client associations
        console.log('\n=== USERS ===');
        const users = await db.user.findAll({
            attributes: ['id', 'email', 'role', 'full_name', 'client_id', 'is_active'],
            include: [{
                model: db.client,
                as: 'client',
                attributes: ['name', 'code']
            }],
            order: [['id', 'ASC']]
        });

        if (users.length === 0) {
            console.log('❌ No users found in database!');
        } else {
            console.table(users.map(u => ({
                ID: u.id,
                Email: u.email,
                Role: u.role,
                Name: u.full_name,
                'Client ID': u.client_id,
                'Client Name': u.client ? u.client.name : 'NULL',
                'Client Code': u.client ? u.client.code : 'NULL',
                Active: u.is_active ? '✓' : '✗'
            })));
        }

        // 3. Check for Williams Property users specifically
        console.log('\n=== WILLIAMS PROPERTY USERS ===');
        const wpsgUsers = await db.user.findAll({
            where: {
                email: {
                    [db.Sequelize.Op.or]: [
                        { [db.Sequelize.Op.like]: '%@williamspropertyservices.co.nz' },
                        { [db.Sequelize.Op.like]: '%@wpsg.nz' }
                    ]
                }
            },
            include: [{
                model: db.client,
                as: 'client',
                attributes: ['name', 'code']
            }]
        });

        if (wpsgUsers.length === 0) {
            console.log('⚠️  No Williams Property users found');
            console.log('   This means users need to be created first');
        } else {
            console.table(wpsgUsers.map(u => ({
                Email: u.email,
                Role: u.role,
                'Client ID': u.client_id,
                'Client Name': u.client ? u.client.name : 'NULL',
                'Should Be': 'WPSG'
            })));
        }

        // 4. Summary
        console.log('\n=== SUMMARY ===');
        console.log(`Total Clients: ${clients.length}`);
        console.log(`Total Users: ${users.length}`);
        console.log(`Williams Property Users: ${wpsgUsers.length}`);
        
        // Check if WPSG client exists
        const wpsgClient = clients.find(c => c.code === 'WPSG');
        if (wpsgClient) {
            console.log(`✅ WPSG Client exists (ID: ${wpsgClient.id})`);
            const wpsgUserCount = users.filter(u => u.client_id === wpsgClient.id).length;
            console.log(`   Users assigned to WPSG: ${wpsgUserCount}`);
        } else {
            console.log('❌ WPSG Client does NOT exist yet');
        }

        // Check if VisionWest client exists
        const vwClient = clients.find(c => c.code === 'VISIONWEST');
        if (vwClient) {
            console.log(`✅ VisionWest Client exists (ID: ${vwClient.id})`);
            const vwUserCount = users.filter(u => u.client_id === vwClient.id).length;
            console.log(`   Users assigned to VisionWest: ${vwUserCount}`);
        } else {
            console.log('❌ VisionWest Client does NOT exist');
        }

        console.log('\n✅ Check complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nStack trace:', error.stack);
    } finally {
        await db.sequelize.close();
        process.exit(0);
    }
};

checkDatabaseState();
