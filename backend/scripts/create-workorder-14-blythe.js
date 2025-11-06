/**
 * Script to create work order for 14 Blythe Place
 * 
 * This work order came via email and needs to be added to the system.
 * Photos will be uploaded later.
 * 
 * Usage: node scripts/create-workorder-14-blythe.js
 */

require('dotenv').config();
const db = require('../models');
const WorkOrder = db.workOrder;
const StatusUpdate = db.statusUpdate;
const User = db.user;
const Client = db.client;

async function createWorkOrder() {
    try {
        console.log('\n🚀 Creating Work Order for 14 Blythe Place...\n');

        // Find Emerge client (client_id = 3 on production)
        const client = await Client.findOne({
            where: { id: 3 } // Emerge Aotearoa (production)
        });

        if (!client) {
            throw new Error('Emerge client not found');
        }

        // Find a WPSG staff user to be the creator
        // In production, this would be the user who enters the email-based work order
        const staffUser = await User.findOne({
            where: {
                client_id: 8, // WPSG
                role: ['staff', 'admin'],
                is_active: true
            }
        });

        if (!staffUser) {
            throw new Error('No WPSG staff user found. Please create a staff user first.');
        }

        console.log(`✓ Found client: ${client.name}`);
        console.log(`✓ Creating work order as: ${staffUser.full_name} (${staffUser.email})\n`);

        // Generate job number (format: EMG + 6 digits for Emerge client)
        // Get the last work order for this client to determine next number
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

        // Work order data from the email
        const workOrderData = {
            job_no: jobNo,
            client_id: client.id,

            // Property details
            property_name: '14 Blythe Place, Glendene',
            property_address: '14 Blythe Place, Glendene, Auckland',
            property_phone: null,

            // Contact details - Tenancy Manager Jacqui
            authorized_by: 'Jacqui Pandah',
            authorized_contact: 'Tenancy Manager',
            authorized_email: 'Jacqui.Pandah@emergeaotearoa.org.nz',

            // Supplier details - Rubbish removal service
            supplier_name: 'Rubbish Removal Service',
            supplier_phone: null,
            supplier_email: null,

            // Work details
            description: 'Rubbish pickup and removal. All items removed safely, site inspected and left tidy. Customer confirmed satisfaction upon completion.',

            // Status and dates
            status: 'completed',
            date: '2024-11-05', // Actual work date

            // PO Number
            po_number: null,

            // Metadata
            is_urgent: false,
            created_by: staffUser.id,
            createdAt: new Date(), // Use current timestamp for production
            updatedAt: new Date(),
        };

        // Create the work order
        const workOrder = await WorkOrder.create(workOrderData);

        // Add detailed notes as status updates
        await StatusUpdate.create({
            work_order_id: workOrder.id,
            previous_status: 'pending',
            new_status: 'completed',
            status: 'completed',
            notes: `Cost: $150.00
Time: Truck arrived 9:35 AM, left 9:55 AM
Duration: 20 minutes

Driver Notes: Rubbish pickup completed as requested. All items removed safely, site inspected and left tidy. Customer confirmed satisfaction upon completion.

Photos: Pending upload from driver`,
            updated_by: staffUser.id,
            createdAt: new Date(), // Use current timestamp
        });

        console.log('═'.repeat(60));
        console.log('✅ WORK ORDER CREATED SUCCESSFULLY');
        console.log('═'.repeat(60));
        console.log(`Job Number:        ${workOrder.job_no}`);
        console.log(`Property:          ${workOrder.property_name}`);
        console.log(`Address:           ${workOrder.property_address}`);
        console.log(`Contact:           ${workOrder.authorized_by} (${workOrder.authorized_contact})`);
        console.log(`Supplier:          ${workOrder.supplier_name}`);
        console.log(`Description:       ${workOrder.description}`);
        console.log(`Status:            ${workOrder.status}`);
        console.log(`Date:              ${workOrder.date}`);
        console.log(`Cost:              $150.00`);
        console.log(`Created by:        ${staffUser.full_name}`);
        console.log('═'.repeat(60));
        console.log('\n📝 Status update added with time and cost details');
        console.log('📸 Note: Photos to be uploaded separately once received from driver\n');
        console.log(`🔗 View in system: ${process.env.FRONTEND_URL}/work-orders/${workOrder.id}\n`);

        return workOrder;

    } catch (error) {
        console.error('\n❌ Error creating work order:', error.message);
        if (error.errors) {
            console.error('\nValidation errors:');
            error.errors.forEach(err => {
                console.error(`  - ${err.path}: ${err.message}`);
            });
        }
        console.error('\n', error);
        process.exit(1);
    }
}

// Run the script
createWorkOrder()
    .then(() => {
        console.log('✨ Script completed successfully\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
