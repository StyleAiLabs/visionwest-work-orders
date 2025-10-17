/**
 * Verification Script: Phase 3 Migration
 *
 * This script verifies that Phase 3 of the multi-client migration completed successfully.
 * It runs all validation queries from migration.md.
 */

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

// Database connection
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    logging: false
});

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

async function verifyPhase3() {
    try {
        await sequelize.authenticate();
        log('✅ Database connection established', 'green');

        logSection('Phase 3 Verification');

        let allTestsPassed = true;

        // Test 1: Verify client_id is NOT NULL in users table
        log('\n1️⃣ Checking users.client_id is NOT NULL...', 'blue');
        const [usersNullable] = await sequelize.query(`
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'client_id'
        `);

        if (usersNullable[0] && usersNullable[0].is_nullable === 'NO') {
            log('   ✅ users.client_id is NOT NULL', 'green');
        } else {
            log('   ❌ users.client_id is still nullable', 'red');
            allTestsPassed = false;
        }

        // Test 2: Verify client_id is NOT NULL in work_orders table
        log('\n2️⃣ Checking work_orders.client_id is NOT NULL...', 'blue');
        const [workOrdersNullable] = await sequelize.query(`
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'work_orders' AND column_name = 'client_id'
        `);

        if (workOrdersNullable[0] && workOrdersNullable[0].is_nullable === 'NO') {
            log('   ✅ work_orders.client_id is NOT NULL', 'green');
        } else {
            log('   ❌ work_orders.client_id is still nullable', 'red');
            allTestsPassed = false;
        }

        // Test 3: Verify composite indexes exist
        log('\n3️⃣ Checking composite indexes...', 'blue');
        const [indexes] = await sequelize.query(`
            SELECT indexname
            FROM pg_indexes
            WHERE tablename IN ('users', 'work_orders')
            AND (indexname LIKE 'idx_%' OR indexname LIKE 'uq_%')
            ORDER BY indexname
        `);

        const expectedIndexes = [
            'idx_users_client_role',
            'idx_work_orders_client_date',
            'idx_work_orders_client_status',
            'uq_users_client_email',
            'uq_work_orders_client_job_no'
        ];

        const existingIndexNames = indexes.map(i => i.indexname);

        log('   Expected indexes:', 'yellow');
        for (const expectedIndex of expectedIndexes) {
            if (existingIndexNames.includes(expectedIndex)) {
                log(`     ✅ ${expectedIndex}`, 'green');
            } else {
                log(`     ❌ ${expectedIndex} - MISSING`, 'red');
                allTestsPassed = false;
            }
        }

        // Test 4: Verify no NULL client_id values exist
        log('\n4️⃣ Verifying no NULL client_id values...', 'blue');
        const [usersWithNull] = await sequelize.query(`
            SELECT COUNT(*) as count FROM users WHERE client_id IS NULL
        `);

        if (usersWithNull[0].count === '0') {
            log('   ✅ No users with NULL client_id', 'green');
        } else {
            log(`   ❌ Found ${usersWithNull[0].count} users with NULL client_id`, 'red');
            allTestsPassed = false;
        }

        const [workOrdersWithNull] = await sequelize.query(`
            SELECT COUNT(*) as count FROM work_orders WHERE client_id IS NULL
        `);

        if (workOrdersWithNull[0].count === '0') {
            log('   ✅ No work orders with NULL client_id', 'green');
        } else {
            log(`   ❌ Found ${workOrdersWithNull[0].count} work orders with NULL client_id`, 'red');
            allTestsPassed = false;
        }

        // Test 5: Verify all records have valid client_id (foreign key integrity)
        log('\n5️⃣ Verifying foreign key integrity...', 'blue');
        const [orphanedUsers] = await sequelize.query(`
            SELECT COUNT(*) as count FROM users u
            LEFT JOIN clients c ON u.client_id = c.id
            WHERE u.client_id IS NOT NULL AND c.id IS NULL
        `);

        if (orphanedUsers[0].count === '0') {
            log('   ✅ No orphaned users (all have valid client_id)', 'green');
        } else {
            log(`   ❌ Found ${orphanedUsers[0].count} users with invalid client_id`, 'red');
            allTestsPassed = false;
        }

        const [orphanedWorkOrders] = await sequelize.query(`
            SELECT COUNT(*) as count FROM work_orders wo
            LEFT JOIN clients c ON wo.client_id = c.id
            WHERE wo.client_id IS NOT NULL AND c.id IS NULL
        `);

        if (orphanedWorkOrders[0].count === '0') {
            log('   ✅ No orphaned work orders (all have valid client_id)', 'green');
        } else {
            log(`   ❌ Found ${orphanedWorkOrders[0].count} work orders with invalid client_id`, 'red');
            allTestsPassed = false;
        }

        // Test 6: Verify unique constraints work per client
        log('\n6️⃣ Verifying unique constraints are client-scoped...', 'blue');
        const [duplicateEmails] = await sequelize.query(`
            SELECT client_id, email, COUNT(*) as count
            FROM users
            GROUP BY client_id, email
            HAVING COUNT(*) > 1
        `);

        if (duplicateEmails.length === 0) {
            log('   ✅ No duplicate emails per client', 'green');
        } else {
            log(`   ❌ Found ${duplicateEmails.length} duplicate email(s) per client`, 'red');
            allTestsPassed = false;
        }

        const [duplicateJobNos] = await sequelize.query(`
            SELECT client_id, job_no, COUNT(*) as count
            FROM work_orders
            WHERE job_no IS NOT NULL
            GROUP BY client_id, job_no
            HAVING COUNT(*) > 1
        `);

        if (duplicateJobNos.length === 0) {
            log('   ✅ No duplicate job numbers per client', 'green');
        } else {
            log(`   ❌ Found ${duplicateJobNos.length} duplicate job number(s) per client`, 'red');
            allTestsPassed = false;
        }

        // Summary
        logSection('Verification Summary');
        if (allTestsPassed) {
            log('\n🎉 All Phase 3 verifications passed!', 'green');
            log('Phase 3 migration is complete and working correctly.', 'green');
        } else {
            log('\n⚠️  Some Phase 3 verifications failed', 'red');
            log('Please review the errors above and fix the issues.', 'red');
        }

        await sequelize.close();
        process.exit(allTestsPassed ? 0 : 1);

    } catch (error) {
        log(`\n❌ Verification failed: ${error.message}`, 'red');
        console.error(error);
        await sequelize.close();
        process.exit(1);
    }
}

// Run verification
log('\n╔══════════════════════════════════════════════════════════════════════╗', 'cyan');
log('║        PHASE 3 MIGRATION VERIFICATION                                ║', 'cyan');
log('╚══════════════════════════════════════════════════════════════════════╝\n', 'cyan');

verifyPhase3();
