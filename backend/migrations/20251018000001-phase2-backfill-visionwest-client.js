'use strict';

/**
 * Migration: Phase 2 - Backfill Existing Data with Visionwest Client
 *
 * Purpose: Assign all existing users and work orders to the Visionwest client
 * Feature: Multi-Client Work Order Management
 *
 * This is Phase 2 of a 4-phase migration strategy:
 * - Phase 1: Create clients table, add nullable client_id columns ✅
 * - Phase 2: Backfill existing data with Visionwest client (this migration)
 * - Phase 3: Make client_id NOT NULL, add composite indexes
 * - Phase 4: Deploy application code changes
 *
 * Safety: Idempotent - can be run multiple times without issues
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Phase 2 Migration: Starting backfill...');

      // Step 1: Get Visionwest client ID
      console.log('  - Fetching Visionwest client...');
      const [clients] = await queryInterface.sequelize.query(
        `SELECT id, name, code FROM clients WHERE code = 'VISIONWEST'`,
        { transaction }
      );

      if (clients.length === 0) {
        throw new Error('Visionwest client not found. Ensure Phase 1 migration ran successfully.');
      }

      const visionwestClientId = clients[0].id;
      console.log(`  - Found Visionwest client (ID: ${visionwestClientId})`);

      // Step 2: Backfill users table
      console.log('  - Backfilling users table...');
      const [usersResult] = await queryInterface.sequelize.query(
        `UPDATE users
         SET client_id = :clientId
         WHERE client_id IS NULL`,
        {
          replacements: { clientId: visionwestClientId },
          transaction
        }
      );

      // Count affected rows
      const [usersCount] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM users WHERE client_id = :clientId`,
        {
          replacements: { clientId: visionwestClientId },
          transaction
        }
      );

      console.log(`  - Updated users: ${usersCount[0].count} users assigned to Visionwest`);

      // Step 3: Backfill work_orders table
      console.log('  - Backfilling work_orders table...');
      const [workOrdersResult] = await queryInterface.sequelize.query(
        `UPDATE work_orders
         SET client_id = :clientId
         WHERE client_id IS NULL`,
        {
          replacements: { clientId: visionwestClientId },
          transaction
        }
      );

      // Count affected rows
      const [workOrdersCount] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM work_orders WHERE client_id = :clientId`,
        {
          replacements: { clientId: visionwestClientId },
          transaction
        }
      );

      console.log(`  - Updated work orders: ${workOrdersCount[0].count} work orders assigned to Visionwest`);

      // Step 4: Verify no NULL values remain
      console.log('  - Verifying backfill...');
      const [usersNullCount] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM users WHERE client_id IS NULL`,
        { transaction }
      );

      const [workOrdersNullCount] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM work_orders WHERE client_id IS NULL`,
        { transaction }
      );

      if (usersNullCount[0].count > 0 || workOrdersNullCount[0].count > 0) {
        throw new Error(
          `Verification failed: ${usersNullCount[0].count} users and ${workOrdersNullCount[0].count} work orders still have NULL client_id`
        );
      }

      await transaction.commit();
      console.log('✅ Phase 2 Migration: Backfill complete');
      console.log(`   - ${usersCount[0].count} users assigned to Visionwest`);
      console.log(`   - ${workOrdersCount[0].count} work orders assigned to Visionwest`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Phase 2 Migration: Backfill failed');
      console.error('   Error:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Phase 2 Migration Rollback: Starting...');

      // Get Visionwest client ID
      const [clients] = await queryInterface.sequelize.query(
        `SELECT id FROM clients WHERE code = 'VISIONWEST'`,
        { transaction }
      );

      if (clients.length > 0) {
        const visionwestClientId = clients[0].id;

        // Reset users client_id to NULL
        console.log('  - Resetting users.client_id to NULL...');
        await queryInterface.sequelize.query(
          `UPDATE users SET client_id = NULL WHERE client_id = :clientId`,
          {
            replacements: { clientId: visionwestClientId },
            transaction
          }
        );

        // Reset work_orders client_id to NULL
        console.log('  - Resetting work_orders.client_id to NULL...');
        await queryInterface.sequelize.query(
          `UPDATE work_orders SET client_id = NULL WHERE client_id = :clientId`,
          {
            replacements: { clientId: visionwestClientId },
            transaction
          }
        );
      }

      await transaction.commit();
      console.log('✅ Phase 2 Migration Rollback: Complete');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Phase 2 Migration Rollback: Failed');
      console.error('   Error:', error.message);
      throw error;
    }
  }
};
