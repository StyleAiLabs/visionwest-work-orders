/**
 * Script to delete the incomplete work order and create a proper one
 */

require('dotenv').config();
const db = require('../models');
const WorkOrder = db.workOrder;

async function deleteAndRecreate() {
    try {
        // Delete the incomplete work order
        const deleted = await WorkOrder.destroy({
            where: {
                job_no: 'RBWO011119'
            }
        });

        if (deleted) {
            console.log('✓ Deleted incomplete work order RBWO011119');
        } else {
            console.log('No work order found with job_no RBWO011119');
        }

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

deleteAndRecreate()
    .then(() => {
        console.log('✨ Done. Now run: node scripts/create-workorder-14-blythe.js\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed:', error);
        process.exit(1);
    });
