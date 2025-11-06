/**
 * Add status update with detailed notes to existing work order #36 (RBWO011119)
 */

require('dotenv').config();
const db = require('../models');
const StatusUpdate = db.statusUpdate;
const User = db.user;

async function addStatusUpdate() {
    try {
        console.log('\n📝 Adding status update to Work Order RBWO011119...\n');

        // Find a WPSG staff user
        const staffUser = await User.findOne({
            where: {
                client_id: 8,
                role: ['staff', 'admin'],
                is_active: true
            }
        });

        if (!staffUser) {
            throw new Error('No WPSG staff user found');
        }

        // Add detailed notes as status update
        const statusUpdate = await StatusUpdate.create({
            work_order_id: 36, // The work order ID from the database
            previous_status: 'pending',
            new_status: 'completed',
            status: 'completed',
            notes: `Cost: $150.00
Time: Truck arrived 9:35 AM, left 9:55 AM (Nov 5, 2024)
Duration: 20 minutes

Tenancy Manager: Jacky

Driver Notes: Rubbish pickup completed as requested. All items removed safely, site inspected and left tidy. Customer confirmed satisfaction upon completion.

Photos: Pending upload from driver`,
            updated_by: staffUser.id,
            createdAt: new Date('2024-11-05T09:55:00'),
        });

        console.log('═'.repeat(60));
        console.log('✅ STATUS UPDATE ADDED SUCCESSFULLY');
        console.log('═'.repeat(60));
        console.log(`Work Order:        RBWO011119 (ID: 36)`);
        console.log(`Status:            pending → completed`);
        console.log(`Updated by:        ${staffUser.full_name}`);
        console.log(`Update ID:         ${statusUpdate.id}`);
        console.log('═'.repeat(60));
        console.log('\n📸 Note: Photos to be uploaded separately once received from driver\n');
        console.log(`🔗 View in system: ${process.env.FRONTEND_URL}/work-orders/36\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.errors) {
            console.error('\nValidation errors:');
            error.errors.forEach(err => {
                console.error(`  - ${err.path}: ${err.message}`);
            });
        }
        process.exit(1);
    }
}

addStatusUpdate()
    .then(() => {
        console.log('✨ Done!\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed:', error);
        process.exit(1);
    });
