/**
 * Migration Validation Script
 *
 * Purpose: Verify that the multi-client migration completed successfully
 * and that all data integrity constraints are satisfied.
 *
 * Usage:
 *   node backend/scripts/validate-migration.js
 *
 * This script checks:
 * 1. Schema existence (clients table, client_id columns)
 * 2. Foreign key constraints are in place
 * 3. Indexes exist for performance
 * 4. No NULL client_ids in any table
 * 5. No orphaned records (client_id references non-existent client)
 * 6. Data distribution across clients
 * 7. Index usage in query plans
 */

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    log(title, 'cyan');
    console.log('='.repeat(70));
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Database connection
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    logging: false
});

// Test results tracking
let checksPassed = 0;
let checksFailed = 0;
const checkResults = [];

function recordCheck(checkName, passed, details = '') {
    if (passed) {
        checksPassed++;
        checkResults.push({ check: checkName, status: 'PASS', details });
        logSuccess(`${checkName}: PASS ${details ? '- ' + details : ''}`);
    } else {
        checksFailed++;
        checkResults.push({ check: checkName, status: 'FAIL', details });
        logError(`${checkName}: FAIL ${details ? '- ' + details : ''}`);
    }
}

/**
 * CHECK 1: Verify clients table exists
 */
async function checkClientsTableExists() {
    logSection('CHECK 1: Clients Table Existence');

    try {
        const [results] = await sequelize.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'clients'
            ) as table_exists;
        `);

        const exists = results[0].table_exists;
        recordCheck('Clients table exists', exists);

        if (exists) {
            // Check table structure
            const [columns] = await sequelize.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'clients'
                ORDER BY ordinal_position;
            `);

            logInfo(`Clients table has ${columns.length} columns`);

            const requiredColumns = ['id', 'name', 'code', 'status'];
            const missingColumns = requiredColumns.filter(col =>
                !columns.some(c => c.column_name === col)
            );

            recordCheck(
                'Clients table has required columns',
                missingColumns.length === 0,
                missingColumns.length > 0 ? `Missing: ${missingColumns.join(', ')}` : 'All required columns present'
            );
        }
    } catch (error) {
        recordCheck('Clients table exists', false, error.message);
    }
}

/**
 * CHECK 2: Verify client_id columns exist in all tables
 */
async function checkClientIdColumns() {
    logSection('CHECK 2: client_id Column Existence');

    const tables = [
        'users',
        'work_orders',
        'notifications',
        'notes',
        'photos',
        'work_order_notes',
        'alerts'
    ];

    for (const table of tables) {
        try {
            const [columns] = await sequelize.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = '${table}' AND column_name = 'client_id';
            `);

            const exists = columns.length > 0;
            const isNullable = exists ? columns[0].is_nullable === 'YES' : true;

            recordCheck(
                `${table}.client_id exists`,
                exists,
                exists ? `Type: ${columns[0].data_type}, Nullable: ${isNullable}` : 'Column not found'
            );
        } catch (error) {
            recordCheck(`${table}.client_id exists`, false, error.message);
        }
    }
}

/**
 * CHECK 3: Verify foreign key constraints
 */
async function checkForeignKeys() {
    logSection('CHECK 3: Foreign Key Constraints');

    const expectedForeignKeys = [
        { table: 'users', column: 'client_id', references: 'clients' },
        { table: 'work_orders', column: 'client_id', references: 'clients' },
        { table: 'notifications', column: 'client_id', references: 'clients' },
        { table: 'notes', column: 'client_id', references: 'clients' },
        { table: 'photos', column: 'client_id', references: 'clients' },
        { table: 'work_order_notes', column: 'client_id', references: 'clients' },
        { table: 'alerts', column: 'client_id', references: 'clients' }
    ];

    for (const fk of expectedForeignKeys) {
        try {
            const [constraints] = await sequelize.query(`
                SELECT
                    tc.constraint_name,
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_name = '${fk.table}'
                    AND kcu.column_name = '${fk.column}';
            `);

            const exists = constraints.length > 0;
            const correctReference = exists && constraints[0].foreign_table_name === fk.references;

            recordCheck(
                `${fk.table}.${fk.column} → ${fk.references} FK`,
                exists && correctReference,
                exists ? `References: ${constraints[0].foreign_table_name}` : 'FK not found'
            );
        } catch (error) {
            recordCheck(`${fk.table}.${fk.column} FK`, false, error.message);
        }
    }
}

/**
 * CHECK 4: Verify indexes exist
 */
async function checkIndexes() {
    logSection('CHECK 4: Index Existence');

    const expectedIndexes = [
        { table: 'users', columns: ['client_id', 'role'], name: 'idx_users_client_role' },
        { table: 'work_orders', columns: ['client_id', 'status'], name: 'idx_work_orders_client_status' },
        { table: 'work_orders', columns: ['client_id', 'created_at'], name: 'idx_work_orders_client_created' },
        { table: 'notifications', columns: ['client_id', 'user_id'], name: 'idx_notifications_client_user' },
        { table: 'notes', columns: ['client_id'], name: 'idx_notes_client' },
        { table: 'photos', columns: ['client_id'], name: 'idx_photos_client' },
        { table: 'work_order_notes', columns: ['client_id'], name: 'idx_work_order_notes_client' },
        { table: 'alerts', columns: ['client_id'], name: 'idx_alerts_client' }
    ];

    for (const idx of expectedIndexes) {
        try {
            const [indexes] = await sequelize.query(`
                SELECT
                    i.relname as index_name,
                    a.attname as column_name
                FROM pg_class t
                JOIN pg_index ix ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
                WHERE t.relname = '${idx.table}'
                AND i.relname = '${idx.name}';
            `);

            const exists = indexes.length > 0;

            recordCheck(
                `Index ${idx.name}`,
                exists,
                exists ? `Covers: ${indexes.map(i => i.column_name).join(', ')}` : 'Index not found'
            );
        } catch (error) {
            recordCheck(`Index ${idx.name}`, false, error.message);
        }
    }
}

/**
 * CHECK 5: Verify no NULL client_ids
 */
async function checkNoNullClientIds() {
    logSection('CHECK 5: NULL client_id Detection');

    const tables = [
        'users',
        'work_orders',
        'notifications',
        'notes',
        'photos',
        'work_order_notes',
        'alerts'
    ];

    for (const table of tables) {
        try {
            const [results] = await sequelize.query(`
                SELECT COUNT(*) as null_count
                FROM ${table}
                WHERE client_id IS NULL;
            `);

            const nullCount = parseInt(results[0].null_count);

            recordCheck(
                `${table} has no NULL client_ids`,
                nullCount === 0,
                nullCount > 0 ? `Found ${nullCount} NULL values` : 'All records have client_id'
            );
        } catch (error) {
            recordCheck(`${table} NULL check`, false, error.message);
        }
    }
}

/**
 * CHECK 6: Verify no orphaned records
 */
async function checkNoOrphanedRecords() {
    logSection('CHECK 6: Orphaned Records Detection');

    const tables = [
        'users',
        'work_orders',
        'notifications',
        'notes',
        'photos',
        'work_order_notes',
        'alerts'
    ];

    for (const table of tables) {
        try {
            const [results] = await sequelize.query(`
                SELECT COUNT(*) as orphaned_count
                FROM ${table} t
                LEFT JOIN clients c ON t.client_id = c.id
                WHERE c.id IS NULL AND t.client_id IS NOT NULL;
            `);

            const orphanedCount = parseInt(results[0].orphaned_count);

            recordCheck(
                `${table} has no orphaned records`,
                orphanedCount === 0,
                orphanedCount > 0 ? `Found ${orphanedCount} orphaned records` : 'All client_ids reference valid clients'
            );
        } catch (error) {
            recordCheck(`${table} orphan check`, false, error.message);
        }
    }
}

/**
 * CHECK 7: Analyze data distribution
 */
async function checkDataDistribution() {
    logSection('CHECK 7: Data Distribution Analysis');

    try {
        // Count clients
        const [clientCount] = await sequelize.query(`
            SELECT COUNT(*) as count FROM clients WHERE status = 'active';
        `);

        logInfo(`Active clients: ${clientCount[0].count}`);

        // Check distribution per table
        const tables = ['users', 'work_orders', 'notifications', 'notes', 'photos', 'work_order_notes', 'alerts'];

        for (const table of tables) {
            const [distribution] = await sequelize.query(`
                SELECT
                    c.code as client_code,
                    COUNT(t.*) as record_count
                FROM clients c
                LEFT JOIN ${table} t ON c.id = t.client_id
                GROUP BY c.id, c.code
                ORDER BY record_count DESC;
            `);

            if (distribution.length > 0) {
                logInfo(`${table} distribution:`);
                distribution.forEach(row => {
                    console.log(`  ${row.client_code}: ${row.record_count} records`);
                });

                const totalRecords = distribution.reduce((sum, row) => sum + parseInt(row.record_count), 0);
                recordCheck(
                    `${table} has data`,
                    totalRecords > 0,
                    `Total: ${totalRecords} records`
                );
            }
        }
    } catch (error) {
        recordCheck('Data distribution analysis', false, error.message);
    }
}

/**
 * CHECK 8: Verify index usage in query plans
 */
async function checkIndexUsage() {
    logSection('CHECK 8: Index Usage Verification');

    const testQueries = [
        {
            name: 'Work orders by client and status',
            query: `SELECT * FROM work_orders WHERE client_id = 1 AND status = 'pending'`,
            expectedIndex: 'idx_work_orders_client_status'
        },
        {
            name: 'Users by client and role',
            query: `SELECT * FROM users WHERE client_id = 1 AND role = 'staff'`,
            expectedIndex: 'idx_users_client_role'
        },
        {
            name: 'Notifications by client and user',
            query: `SELECT * FROM notifications WHERE client_id = 1 AND user_id = 1`,
            expectedIndex: 'idx_notifications_client_user'
        }
    ];

    for (const test of testQueries) {
        try {
            const [plan] = await sequelize.query(`EXPLAIN ${test.query}`);
            const planText = plan.map(p => p['QUERY PLAN']).join('\n');

            const usesIndex = planText.includes('Index Scan') || planText.includes(test.expectedIndex);

            recordCheck(
                test.name,
                usesIndex,
                usesIndex ? 'Uses index' : 'Sequential scan (performance concern)'
            );

            if (!usesIndex) {
                logWarning(`Query plan:\n${planText}`);
            }
        } catch (error) {
            recordCheck(test.name, false, error.message);
        }
    }
}

/**
 * Print summary of all checks
 */
async function printSummary() {
    logSection('VALIDATION SUMMARY');

    console.log('\n' + '─'.repeat(70));
    log('Check Results:', 'bold');
    console.log('─'.repeat(70));

    checkResults.forEach((result, index) => {
        const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
        const statusColor = result.status === 'PASS' ? 'green' : 'red';
        log(`${index + 1}. ${result.check}`, 'reset');
        log(`   ${status}`, statusColor);
        if (result.details) {
            log(`   ${result.details}`, 'blue');
        }
    });

    console.log('─'.repeat(70));
    log(`\nTotal Checks: ${checksPassed + checksFailed}`, 'bold');
    log(`Passed: ${checksPassed}`, 'green');
    log(`Failed: ${checksFailed}`, checksFailed > 0 ? 'red' : 'green');
    log(`Pass Rate: ${((checksPassed / (checksPassed + checksFailed)) * 100).toFixed(1)}%`, checksFailed === 0 ? 'green' : 'yellow');
    console.log('─'.repeat(70));

    if (checksFailed === 0) {
        log('\n🎉 ALL CHECKS PASSED! Multi-client migration is valid.', 'green');
        log('✅ Database schema is correct', 'green');
        log('✅ Data integrity is maintained', 'green');
        log('✅ Performance indexes are in place', 'green');
    } else {
        log(`\n⚠️  ${checksFailed} check(s) failed. Review the output above for details.`, 'red');
        log('\n📝 Next steps:', 'yellow');
        log('1. Review the failed checks above', 'yellow');
        log('2. Run the appropriate migration scripts to fix issues', 'yellow');
        log('3. Re-run this validation script to verify fixes', 'yellow');
        log('4. If critical issues persist, consider using rollback-migration.js', 'yellow');
    }
}

/**
 * Main validation routine
 */
async function main() {
    log('\n╔══════════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        MULTI-CLIENT MIGRATION VALIDATION                           ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════════════════╝\n', 'cyan');

    try {
        // Connect to database
        await sequelize.authenticate();
        logSuccess('Database connection established');

        // Run all validation checks
        await checkClientsTableExists();
        await checkClientIdColumns();
        await checkForeignKeys();
        await checkIndexes();
        await checkNoNullClientIds();
        await checkNoOrphanedRecords();
        await checkDataDistribution();
        await checkIndexUsage();

        // Print summary
        await printSummary();

        // Close connection
        await sequelize.close();
        process.exit(checksFailed === 0 ? 0 : 1);

    } catch (error) {
        logError(`Validation failed: ${error.message}`);
        console.error(error);
        await sequelize.close();
        process.exit(1);
    }
}

// Run validation
main();
