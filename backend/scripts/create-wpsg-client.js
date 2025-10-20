/**
 * Create Williams Property Services Group (WPSG) Client
 * and assign admin/staff users to it
 */

const db = require('../models');

const createWPSGClient = async () => {
    try {
        console.log('🔌 Connecting to database...');
        await db.sequelize.authenticate();
        console.log('✅ Database connection established');
        console.log('   Database:', db.sequelize.config.database);
        console.log('   Host:', db.sequelize.config.host);

        // Step 1: Check if WPSG client already exists
        console.log('\n🔍 Checking if WPSG client exists...');
        let wpsgClient = await db.client.findOne({
            where: { code: 'WPSG' }
        });

        if (wpsgClient) {
            console.log('ℹ️  WPSG client already exists:', {
                id: wpsgClient.id,
                name: wpsgClient.name,
                code: wpsgClient.code
            });
        } else {
            // Create WPSG client
            console.log('Creating Williams Property Services Group client...');
            wpsgClient = await db.client.create({
                name: 'Williams Property Services Group',
                code: 'WPSG',
                status: 'active',
                primary_contact_name: 'Williams Property Admin',
                primary_contact_email: 'admin@williamspropertyservices.co.nz',
                primary_contact_phone: '+64 9 XXX XXXX',
                settings: {}
            });
            console.log('✅ WPSG client created:', {
                id: wpsgClient.id,
                name: wpsgClient.name,
                code: wpsgClient.code
            });
        }

        // Step 2: Find Williams Property admin/staff users
        console.log('\nFinding Williams Property users...');
        const wpsgUsers = await db.user.findAll({
            where: {
                email: {
                    [db.Sequelize.Op.like]: '%williamspropertyservices%'
                }
            }
        });

        console.log(`Found ${wpsgUsers.length} Williams Property users`);

        // Step 3: Update users to belong to WPSG client
        if (wpsgUsers.length > 0) {
            console.log('\nUpdating users to WPSG client...');
            for (const user of wpsgUsers) {
                await user.update({ client_id: wpsgClient.id });
                console.log(`  ✅ Updated ${user.email} (${user.role}) -> WPSG client`);
            }
        } else {
            console.log('⚠️  No Williams Property users found to update');
        }

        // Step 4: Verify the setup
        console.log('\n=== Verification ===');
        const updatedUsers = await db.user.findAll({
            where: { client_id: wpsgClient.id },
            include: [{
                model: db.client,
                as: 'client',
                attributes: ['id', 'name', 'code']
            }]
        });

        console.log(`\n✅ ${updatedUsers.length} users now belong to WPSG:`);
        updatedUsers.forEach(user => {
            console.log(`   - ${user.email} (${user.role})`);
        });

        console.log('\n✅ Setup complete!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.sequelize.close();
        process.exit(0);
    }
};

createWPSGClient();
