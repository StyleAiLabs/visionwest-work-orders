/**
 * DRY RUN - Preview what would be created without actually creating it
 * 
 * Usage: node scripts/preview-workorder-14-blythe.js
 */

require('dotenv').config();
const db = require('../models');
const WorkOrder = db.workOrder;
const User = db.user;
const Client = db.client;

async function previewWorkOrder() {
    try {
        console.log('\n🔍 PREVIEW MODE - No changes will be made\n');
        console.log('═'.repeat(60));

        // Find Emerge client (client_id = 3 on production)
        const client = await Client.findOne({
            where: { id: 3 } // Emerge Aotearoa (production)
        });

        if (!client) {
            console.log('❌ Emerge client not found');
            process.exit(1);
        }

        console.log(`✓ Found client: ${client.name} (ID: ${client.id})`);

        // Find any WPSG staff/admin user
        const staffUser = await User.findOne({
            where: {
                client_id: 8, // WPSG
                role: ['staff', 'admin'],
                is_active: true
            }
        });

        if (!staffUser) {
            console.log('❌ No WPSG staff user found');
            process.exit(1);
        }

        console.log(`✓ Found staff user: ${staffUser.full_name} (ID: ${staffUser.id}, Email: ${staffUser.email})`);

        // Get the last work order for this client
        const lastWorkOrder = await WorkOrder.findOne({
            where: { client_id: client.id },
            order: [['createdAt', 'DESC']],
            attributes: ['job_no']
        });

        let nextNumber = 1;
        if (lastWorkOrder && lastWorkOrder.job_no) {
            const match = lastWorkOrder.job_no.match(/EMG(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        const jobNo = `EMG${String(nextNumber).padStart(6, '0')}`;

        console.log(`✓ Next job number would be: ${jobNo}`);
        if (lastWorkOrder) {
            console.log(`  (Last job number: ${lastWorkOrder.job_no})`);
        }

        // Check if this job number already exists
        const existing = await WorkOrder.findOne({
            where: { job_no: jobNo }
        });

        if (existing) {
            console.log(`\n⚠️  WARNING: Job number ${jobNo} already exists!`);
            console.log(`   Existing work order ID: ${existing.id}`);
            console.log(`   Property: ${existing.property_name}`);
        }

        console.log('\n' + '═'.repeat(60));
        console.log('📋 WORK ORDER PREVIEW');
        console.log('═'.repeat(60));
        console.log(`Job Number:        ${jobNo}`);
        console.log(`Client:            ${client.name} (ID: ${client.id})`);
        console.log(`Property:          14 Blythe Place, Glendene`);
        console.log(`Address:           14 Blythe Place, Glendene, Auckland`);
        console.log(`Contact:           Jacqui Pandah (Tenancy Manager)`);
        console.log(`Email:             Jacqui.Pandah@emergeaotearoa.org.nz`);
        console.log(`Supplier:          Rubbish Removal Service`);
        console.log(`Description:       Rubbish pickup and removal`);
        console.log(`Status:            completed`);
        console.log(`Date:              2024-11-05`);
        console.log(`Cost:              $150.00`);
        console.log(`Created by:        ${staffUser.full_name}`);
        console.log(`Is Urgent:         No`);
        console.log('═'.repeat(60));

        console.log('\n📝 Status Update Preview:');
        console.log('   Previous Status: pending');
        console.log('   New Status:      completed');
        console.log('   Notes:           Cost, time, and driver notes included');

        console.log('\n✅ Preview complete - no changes made');
        console.log('\n💡 To create this work order, run:');
        console.log('   node scripts/create-workorder-14-blythe.js\n');

    } catch (error) {
        console.error('\n❌ Error during preview:', error.message);
        process.exit(1);
    }
}

// Run the preview
previewWorkOrder()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Preview failed:', error);
        process.exit(1);
    });
