/**
 * Test Script: Model Associations
 *
 * This script verifies that all Sequelize models and their associations
 * are configured correctly for the multi-client architecture.
 */

const db = require('../models');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    log(title, 'cyan');
    console.log('='.repeat(70));
}

async function testModels() {
    try {
        await db.sequelize.authenticate();
        log('✅ Database connection established', 'green');

        logSection('Testing Model Associations');

        let allTestsPassed = true;

        // Test 1: Verify Client model exists
        log('\n1️⃣ Checking Client model...', 'blue');
        if (db.client && db.client.associations) {
            log('   ✅ Client model loaded', 'green');
            log(`   - Associations: ${Object.keys(db.client.associations).join(', ')}`, 'yellow');
        } else {
            log('   ❌ Client model not found', 'red');
            allTestsPassed = false;
        }

        // Test 2: Verify User model has client association
        log('\n2️⃣ Checking User model...', 'blue');
        if (db.user && db.user.associations && db.user.associations.client) {
            log('   ✅ User model loaded with client association', 'green');
            log(`   - Associations: ${Object.keys(db.user.associations).join(', ')}`, 'yellow');
        } else {
            log('   ❌ User model missing client association', 'red');
            allTestsPassed = false;
        }

        // Test 3: Verify WorkOrder model has client association
        log('\n3️⃣ Checking WorkOrder model...', 'blue');
        if (db.workOrder && db.workOrder.associations && db.workOrder.associations.client) {
            log('   ✅ WorkOrder model loaded with client association', 'green');
            log(`   - Associations: ${Object.keys(db.workOrder.associations).join(', ')}`, 'yellow');
        } else {
            log('   ❌ WorkOrder model missing client association', 'red');
            allTestsPassed = false;
        }

        // Test 4: Test Client.hasMany(User) association
        log('\n4️⃣ Checking Client → User association...', 'blue');
        if (db.client.associations.users) {
            log('   ✅ Client.hasMany(User) configured', 'green');
        } else {
            log('   ❌ Client.hasMany(User) not configured', 'red');
            allTestsPassed = false;
        }

        // Test 5: Test Client.hasMany(WorkOrder) association
        log('\n5️⃣ Checking Client → WorkOrder association...', 'blue');
        if (db.client.associations.workOrders) {
            log('   ✅ Client.hasMany(WorkOrder) configured', 'green');
        } else {
            log('   ❌ Client.hasMany(WorkOrder) not configured', 'red');
            allTestsPassed = false;
        }

        // Test 6: Fetch a client with associations
        log('\n6️⃣ Testing database query with associations...', 'blue');
        try {
            const client = await db.client.findOne({
                where: { code: 'VISIONWEST' },
                include: [
                    { model: db.user, as: 'users' },
                    { model: db.workOrder, as: 'workOrders' }
                ]
            });

            if (client) {
                log('   ✅ Successfully queried client with associations', 'green');
                log(`   - Client: ${client.name} (${client.code})`, 'yellow');
                log(`   - Users: ${client.users ? client.users.length : 0}`, 'yellow');
                log(`   - Work Orders: ${client.workOrders ? client.workOrders.length : 0}`, 'yellow');
            } else {
                log('   ⚠️  Visionwest client not found (may need to run migrations)', 'yellow');
            }
        } catch (error) {
            log(`   ❌ Error querying with associations: ${error.message}`, 'red');
            allTestsPassed = false;
        }

        // Test 7: Check model attributes
        log('\n7️⃣ Verifying model attributes...', 'blue');
        const clientAttrs = Object.keys(db.client.rawAttributes);
        const userAttrs = Object.keys(db.user.rawAttributes);
        const workOrderAttrs = Object.keys(db.workOrder.rawAttributes);

        if (clientAttrs.includes('code') && clientAttrs.includes('name')) {
            log('   ✅ Client model has required attributes', 'green');
        } else {
            log('   ❌ Client model missing required attributes', 'red');
            allTestsPassed = false;
        }

        if (userAttrs.includes('client_id')) {
            log('   ✅ User model has client_id attribute', 'green');
        } else {
            log('   ❌ User model missing client_id attribute', 'red');
            allTestsPassed = false;
        }

        if (workOrderAttrs.includes('client_id')) {
            log('   ✅ WorkOrder model has client_id attribute', 'green');
        } else {
            log('   ❌ WorkOrder model missing client_id attribute', 'red');
            allTestsPassed = false;
        }

        // Summary
        logSection('Test Summary');
        if (allTestsPassed) {
            log('\n🎉 All model tests passed!', 'green');
            log('Models and associations are configured correctly.', 'green');
        } else {
            log('\n⚠️  Some model tests failed', 'red');
            log('Please review the errors above.', 'red');
        }

        await db.sequelize.close();
        process.exit(allTestsPassed ? 0 : 1);

    } catch (error) {
        log(`\n❌ Test failed: ${error.message}`, 'red');
        console.error(error);
        await db.sequelize.close();
        process.exit(1);
    }
}

// Run tests
log('\n╔══════════════════════════════════════════════════════════════════════╗', 'cyan');
log('║        MODEL & ASSOCIATION TESTS                                     ║', 'cyan');
log('╚══════════════════════════════════════════════════════════════════════╝\n', 'cyan');

testModels();
