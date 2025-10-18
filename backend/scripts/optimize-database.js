/**
 * Database Optimization Script
 *
 * This script runs ANALYZE on key tables to update database statistics
 * for optimal query planning and performance.
 *
 * Usage: node backend/scripts/optimize-database.js
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

async function analyzeTable(tableName) {
    try {
        log.info(`Analyzing table: ${tableName}...`);

        // Get row count before ANALYZE
        const [countBefore] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);

        // Run ANALYZE
        await sequelize.query(`ANALYZE ${tableName}`);

        // Get statistics
        const [stats] = await sequelize.query(`
            SELECT
                schemaname,
                tablename,
                n_live_tup as row_count,
                n_dead_tup as dead_rows,
                last_analyze,
                last_autoanalyze
            FROM pg_stat_user_tables
            WHERE tablename = '${tableName}';
        `);

        log.success(`${tableName} analyzed successfully`);
        if (stats.length > 0) {
            log.info(`  Rows: ${stats[0].row_count}`);
            log.info(`  Dead rows: ${stats[0].dead_rows}`);
            log.info(`  Last analyzed: ${stats[0].last_analyze || 'Never'}`);
        }

        return true;
    } catch (error) {
        log.error(`Failed to analyze ${tableName}: ${error.message}`);
        return false;
    }
}

async function analyzeIndexes(tableName) {
    try {
        const [indexes] = await sequelize.query(`
            SELECT
                i.relname as index_name,
                a.attname as column_name,
                ix.indisunique as is_unique,
                ix.indisprimary as is_primary
            FROM pg_class t
            JOIN pg_index ix ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            WHERE t.relname = '${tableName}'
            AND t.relkind = 'r'
            ORDER BY i.relname;
        `);

        if (indexes.length > 0) {
            log.info(`  Indexes on ${tableName}:`);
            const indexGroups = indexes.reduce((acc, idx) => {
                if (!acc[idx.index_name]) {
                    acc[idx.index_name] = {
                        columns: [],
                        is_unique: idx.is_unique,
                        is_primary: idx.is_primary
                    };
                }
                acc[idx.index_name].columns.push(idx.column_name);
                return acc;
            }, {});

            Object.entries(indexGroups).forEach(([name, info]) => {
                const type = info.is_primary ? 'PRIMARY' : (info.is_unique ? 'UNIQUE' : 'INDEX');
                log.info(`    ${name} (${type}): ${info.columns.join(', ')}`);
            });
        }

        return true;
    } catch (error) {
        log.warn(`Could not retrieve index info for ${tableName}: ${error.message}`);
        return false;
    }
}

async function main() {
    try {
        log.header('Database Optimization - ANALYZE Tables');

        // Connect to database
        await sequelize.authenticate();
        log.success('Database connection established');

        // Tables to analyze (in order of importance)
        const tables = [
            'clients',
            'users',
            'work_orders',
            'work_order_notes',
            'photos',
            'notifications'
        ];

        let successCount = 0;
        let failCount = 0;

        for (const table of tables) {
            log.info('');
            const success = await analyzeTable(table);
            if (success) {
                await analyzeIndexes(table);
                successCount++;
            } else {
                failCount++;
            }
        }

        // Run VACUUM ANALYZE for deeper optimization (optional)
        log.header('Running VACUUM ANALYZE (Deep Optimization)');
        log.warn('This may take a few moments...');

        try {
            for (const table of ['clients', 'users', 'work_orders']) {
                log.info(`VACUUM ANALYZE ${table}...`);
                await sequelize.query(`VACUUM ANALYZE ${table}`);
                log.success(`${table} vacuumed and analyzed`);
            }
        } catch (error) {
            log.warn(`VACUUM ANALYZE skipped: ${error.message}`);
            log.info('(This is normal if you don\'t have vacuum privileges)');
        }

        // Summary
        log.header('Optimization Complete');
        log.success(`Successfully analyzed: ${successCount} tables`);
        if (failCount > 0) {
            log.warn(`Failed to analyze: ${failCount} tables`);
        }

        // Performance recommendations
        log.header('Performance Recommendations');
        log.info('1. Query planner should now use updated statistics');
        log.info('2. Consider running this script after bulk data operations');
        log.info('3. PostgreSQL auto-analyzes tables, but manual ANALYZE ensures freshness');
        log.info('4. Monitor query performance with EXPLAIN ANALYZE');

        await sequelize.close();
        process.exit(failCount > 0 ? 1 : 0);

    } catch (error) {
        log.error(`Error: ${error.message}`);
        console.error(error);
        await sequelize.close();
        process.exit(1);
    }
}

// Run the optimization
if (require.main === module) {
    main();
}

module.exports = main;
