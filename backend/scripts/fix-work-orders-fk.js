/**
 * Fix Work Orders Foreign Key Constraint
 *
 * This script fixes the work_orders.client_id foreign key constraint
 * to reference the clients table instead of the users table.
 *
 * Usage: node backend/scripts/fix-work-orders-fk.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

// Database connection
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    logging: false
});

async function main() {
    try {
        log.header('Work Orders FK Constraint Fix');

        // Connect to database
        await sequelize.authenticate();
        log.success('Database connection established');

        // Step 1: Check current FK constraint
        log.info('Checking current FK constraint...');
        const [currentFKs] = await sequelize.query(`
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
                AND tc.table_name = 'work_orders'
                AND kcu.column_name = 'client_id';
        `);

        if (currentFKs.length === 0) {
            log.warn('No FK constraint found on work_orders.client_id');
        } else {
            const fk = currentFKs[0];
            log.info(`Current FK: ${fk.constraint_name}`);
            log.info(`References: ${fk.foreign_table_name}.${fk.foreign_column_name}`);

            if (fk.foreign_table_name === 'clients') {
                log.success('FK constraint is already correct! No changes needed.');
                await sequelize.close();
                process.exit(0);
            }

            // Step 2: Drop incorrect FK constraint
            log.info(`Dropping incorrect FK constraint: ${fk.constraint_name}`);
            await sequelize.query(`
                ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS ${fk.constraint_name};
            `);
            log.success(`Dropped FK constraint: ${fk.constraint_name}`);
        }

        // Step 3: Add correct FK constraint
        log.info('Adding correct FK constraint to reference clients table...');
        await sequelize.query(`
            ALTER TABLE work_orders
            ADD CONSTRAINT fk_work_orders_client
            FOREIGN KEY (client_id)
            REFERENCES clients(id)
            ON DELETE SET NULL;
        `);
        log.success('Added FK constraint: fk_work_orders_client → clients(id)');

        // Step 4: Verify the fix
        log.info('Verifying FK constraint...');
        const [verifyFKs] = await sequelize.query(`
            SELECT
                tc.constraint_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = 'work_orders'
                AND kcu.column_name = 'client_id';
        `);

        if (verifyFKs.length > 0 && verifyFKs[0].foreign_table_name === 'clients') {
            log.success('✅ FK constraint verified successfully!');
            log.info(`Constraint: ${verifyFKs[0].constraint_name}`);
            log.info(`References: ${verifyFKs[0].foreign_table_name}(${verifyFKs[0].foreign_column_name})`);
        } else {
            log.error('❌ FK constraint verification failed!');
            process.exit(1);
        }

        log.header('Fix Complete');
        log.success('Work orders FK constraint now correctly references clients table');

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        log.error(`Error: ${error.message}`);
        console.error(error);
        await sequelize.close();
        process.exit(1);
    }
}

// Run the fix
if (require.main === module) {
    main();
}

module.exports = main;
