/**
 * Backfill Script: Assign Existing Data to Visionwest Client
 *
 * Purpose: Phase 2 of multi-client migration - assigns all existing users and
 * work orders to the Visionwest client organization
 *
 * This script implements Phase 2 of the 4-phase migration strategy:
 * - Phase 1: Create clients table, add nullable client_id columns ✅
 * - Phase 2: Backfill existing data with Visionwest client_id (this script)
 * - Phase 3: Make client_id NOT NULL, add composite indexes
 * - Phase 4: Deploy application code changes
 *
 * Safety: Can be run multiple times (idempotent)
 */

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  logging: console.log  // Show SQL queries for transparency
});

async function backfillVisionwestClient() {
  try {
    console.log('=== Backfill Script: Assign Data to Visionwest Client ===\n');

    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Step 1: Get Visionwest client ID
    console.log('Step 1: Fetching Visionwest client...');
    const [clients] = await sequelize.query(
      `SELECT id, name, code FROM clients WHERE code = 'VISIONWEST'`
    );

    if (clients.length === 0) {
      throw new Error('Visionwest client not found. Run Phase 1 migration first.');
    }

    const visionwestClientId = clients[0].id;
    console.log(`✅ Found Visionwest client (ID: ${visionwestClientId})\n`);

    // Step 2: Count users needing backfill
    console.log('Step 2: Analyzing users table...');
    const [usersStats] = await sequelize.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(client_id) as users_with_client,
        COUNT(*) - COUNT(client_id) as users_needing_backfill
      FROM users
    `);

    console.log(`   Total users: ${usersStats[0].total_users}`);
    console.log(`   Users with client_id: ${usersStats[0].users_with_client}`);
    console.log(`   Users needing backfill: ${usersStats[0].users_needing_backfill}`);

    // Step 3: Backfill users
    if (usersStats[0].users_needing_backfill > 0) {
      console.log('\nStep 3: Backfilling users table...');
      const [updateResult] = await sequelize.query(`
        UPDATE users
        SET client_id = :clientId
        WHERE client_id IS NULL
      `, {
        replacements: { clientId: visionwestClientId }
      });

      console.log(`✅ Updated ${usersStats[0].users_needing_backfill} users with client_id = ${visionwestClientId}`);
    } else {
      console.log('\n✅ Step 3: All users already have client_id assigned');
    }

    // Step 4: Verify users
    console.log('\nStep 4: Verifying users table...');
    const [usersVerification] = await sequelize.query(`
      SELECT COUNT(*) as null_count FROM users WHERE client_id IS NULL
    `);

    if (usersVerification[0].null_count > 0) {
      throw new Error(`Verification failed: ${usersVerification[0].null_count} users still have NULL client_id`);
    }
    console.log('✅ Verification passed: Zero users with NULL client_id');

    // Step 5: Count work orders needing backfill
    console.log('\nStep 5: Analyzing work_orders table...');
    const [workOrdersStats] = await sequelize.query(`
      SELECT
        COUNT(*) as total_work_orders,
        COUNT(client_id) as work_orders_with_client,
        COUNT(*) - COUNT(client_id) as work_orders_needing_backfill
      FROM work_orders
    `);

    console.log(`   Total work orders: ${workOrdersStats[0].total_work_orders}`);
    console.log(`   Work orders with client_id: ${workOrdersStats[0].work_orders_with_client}`);
    console.log(`   Work orders needing backfill: ${workOrdersStats[0].work_orders_needing_backfill}`);

    // Step 6: Backfill work orders
    if (workOrdersStats[0].work_orders_needing_backfill > 0) {
      console.log('\nStep 6: Backfilling work_orders table...');
      const [updateResult] = await sequelize.query(`
        UPDATE work_orders
        SET client_id = :clientId
        WHERE client_id IS NULL
      `, {
        replacements: { clientId: visionwestClientId }
      });

      console.log(`✅ Updated ${workOrdersStats[0].work_orders_needing_backfill} work orders with client_id = ${visionwestClientId}`);
    } else {
      console.log('\n✅ Step 6: All work orders already have client_id assigned');
    }

    // Step 7: Verify work orders
    console.log('\nStep 7: Verifying work_orders table...');
    const [workOrdersVerification] = await sequelize.query(`
      SELECT COUNT(*) as null_count FROM work_orders WHERE client_id IS NULL
    `);

    if (workOrdersVerification[0].null_count > 0) {
      throw new Error(`Verification failed: ${workOrdersVerification[0].null_count} work orders still have NULL client_id`);
    }
    console.log('✅ Verification passed: Zero work orders with NULL client_id');

    // Final Summary
    console.log('\n=== Backfill Complete ===');
    console.log(`✅ Users assigned to Visionwest: ${usersStats[0].total_users}`);
    console.log(`✅ Work orders assigned to Visionwest: ${workOrdersStats[0].total_work_orders}`);
    console.log('\nNext step: Run Phase 3 migration to make client_id NOT NULL');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Backfill failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Phase 1 migration has been run successfully');
    console.error('2. Verify database connection details');
    console.error('3. Check that Visionwest client exists in clients table');
    process.exit(1);
  }
}

backfillVisionwestClient();
