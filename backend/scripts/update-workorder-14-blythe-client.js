/**
 * Script to update the existing work order to correct client (Emerge) and contact info
 */

require('dotenv').config();
const db = require('../models');
const WorkOrder = db.workOrder;

async function updateWorkOrder() {
    try {
        console.log('\n🔄 Updating Work Order RBWO011119 to Emerge client...\n');

        // Update the work order
        const [updated] = await WorkOrder.update(
            {
                client_id: 7, // Emerge Aotearoa
                authorized_by: 'Jacqui Pandah',
                authorized_contact: 'Tenancy Manager',
                authorized_email: 'Jacqui.Pandah@emergeaotearoa.org.nz',
            },
            {
                where: {
                    job_no: 'RBWO011119'
                }
            }
        );

        if (updated) {
            console.log('✅ Work order updated successfully!');
            console.log('   - Client: Emerge Aotearoa (client_id: 7)');
            console.log('   - Contact: Jacqui Pandah (Tenancy Manager)');
            console.log('   - Email: Jacqui.Pandah@emergeaotearoa.org.nz\n');
        } else {
            console.log('⚠️  No work order found with job_no RBWO011119\n');
        }

    } catch (error) {
        console.error('❌ Error updating work order:', error.message);
        process.exit(1);
    }
}

updateWorkOrder()
    .then(() => {
        console.log('✨ Update completed!\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed:', error);
        process.exit(1);
    });
