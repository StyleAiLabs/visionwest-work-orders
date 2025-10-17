'use strict';

/**
 * Migration: Phase 3 - Multi-Client Support Schema Enforcement
 *
 * Purpose: Make client_id NOT NULL and add composite indexes
 * Feature: Multi-Client Work Order Management
 *
 * This is Phase 3 of a 4-phase migration strategy:
 * - Phase 1: Create clients table, add nullable client_id columns ✅
 * - Phase 2: Backfill existing data with Visionwest client (separate script) ✅
 * - Phase 3: Make client_id NOT NULL, add composite indexes (this migration)
 * - Phase 4: Deploy application code changes
 *
 * Safety: All data must be backfilled before running this migration.
 * Run backend/scripts/backfill-visionwest-client.js first.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Phase 3 Migration: Starting...');

      // Step 1: Verify no NULL client_id values exist in users
      console.log('  - Verifying users table has no NULL client_id values...');
      const [usersNullCount] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM users WHERE client_id IS NULL`,
        { transaction }
      );

      if (usersNullCount[0].count > 0) {
        throw new Error(
          `Cannot proceed: ${usersNullCount[0].count} users have NULL client_id. ` +
          'Run backend/scripts/backfill-visionwest-client.js first.'
        );
      }
      console.log('    ✅ All users have client_id assigned');

      // Step 2: Verify no NULL client_id values exist in work_orders
      console.log('  - Verifying work_orders table has no NULL client_id values...');
      const [workOrdersNullCount] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM work_orders WHERE client_id IS NULL`,
        { transaction }
      );

      if (workOrdersNullCount[0].count > 0) {
        throw new Error(
          `Cannot proceed: ${workOrdersNullCount[0].count} work orders have NULL client_id. ` +
          'Run backend/scripts/backfill-visionwest-client.js first.'
        );
      }
      console.log('    ✅ All work orders have client_id assigned');

      // Step 3: Make users.client_id NOT NULL
      console.log('  - Making users.client_id NOT NULL...');
      await queryInterface.sequelize.query(
        `ALTER TABLE users ALTER COLUMN client_id SET NOT NULL`,
        { transaction }
      );

      // Step 4: Make work_orders.client_id NOT NULL
      console.log('  - Making work_orders.client_id NOT NULL...');
      await queryInterface.sequelize.query(
        `ALTER TABLE work_orders ALTER COLUMN client_id SET NOT NULL`,
        { transaction }
      );

      // Step 5: Drop existing simple index on users.client_id (will be replaced by composite)
      console.log('  - Dropping simple index idx_users_client_id...');
      await queryInterface.removeIndex('users', 'idx_users_client_id', { transaction });

      // Step 6: Add composite index on users (client_id, role)
      console.log('  - Creating composite index idx_users_client_role...');
      await queryInterface.addIndex('users', ['client_id', 'role'], {
        name: 'idx_users_client_role',
        transaction
      });

      // Step 7: Update unique constraint on users.email to be client-scoped
      console.log('  - Creating client-scoped unique constraint on users email...');
      // First, check if there's an existing unique constraint on email
      const [emailConstraints] = await queryInterface.sequelize.query(
        `SELECT constraint_name
         FROM information_schema.table_constraints
         WHERE table_name = 'users' AND constraint_type = 'UNIQUE'
         AND constraint_name LIKE '%email%'`,
        { transaction }
      );

      if (emailConstraints.length > 0) {
        console.log(`    - Dropping existing email constraint: ${emailConstraints[0].constraint_name}`);
        await queryInterface.sequelize.query(
          `ALTER TABLE users DROP CONSTRAINT ${emailConstraints[0].constraint_name}`,
          { transaction }
        );
      }

      // Create new composite unique constraint
      await queryInterface.addConstraint('users', {
        fields: ['client_id', 'email'],
        type: 'unique',
        name: 'uq_users_client_email',
        transaction
      });

      // Step 8: Drop existing simple index on work_orders.client_id (will be replaced by composite)
      console.log('  - Dropping simple index idx_work_orders_client_id...');
      await queryInterface.removeIndex('work_orders', 'idx_work_orders_client_id', { transaction });

      // Step 9: Add composite index on work_orders (client_id, status)
      console.log('  - Creating composite index idx_work_orders_client_status...');
      await queryInterface.addIndex('work_orders', ['client_id', 'status'], {
        name: 'idx_work_orders_client_status',
        transaction
      });

      // Step 10: Add composite index on work_orders (client_id, date DESC)
      console.log('  - Creating composite index idx_work_orders_client_date...');
      await queryInterface.addIndex('work_orders', ['client_id', { attribute: 'date', order: 'DESC' }], {
        name: 'idx_work_orders_client_date',
        transaction
      });

      // Step 11: Update unique constraint on work_orders.job_no to be client-scoped
      console.log('  - Creating client-scoped unique constraint on work_orders job_no...');
      // First, check if there's an existing unique constraint on job_no
      const [jobNoConstraints] = await queryInterface.sequelize.query(
        `SELECT constraint_name
         FROM information_schema.table_constraints
         WHERE table_name = 'work_orders' AND constraint_type = 'UNIQUE'
         AND constraint_name LIKE '%job_no%'`,
        { transaction }
      );

      if (jobNoConstraints.length > 0) {
        console.log(`    - Dropping existing job_no constraint: ${jobNoConstraints[0].constraint_name}`);
        await queryInterface.sequelize.query(
          `ALTER TABLE work_orders DROP CONSTRAINT ${jobNoConstraints[0].constraint_name}`,
          { transaction }
        );
      }

      // Create new composite unique constraint
      await queryInterface.addConstraint('work_orders', {
        fields: ['client_id', 'job_no'],
        type: 'unique',
        name: 'uq_work_orders_client_job_no',
        transaction
      });

      await transaction.commit();
      console.log('✅ Phase 3 Migration: Complete');
      console.log('');
      console.log('Summary of changes:');
      console.log('  - users.client_id: NOW NOT NULL');
      console.log('  - work_orders.client_id: NOW NOT NULL');
      console.log('  - Added composite index: idx_users_client_role');
      console.log('  - Added composite unique constraint: uq_users_client_email');
      console.log('  - Added composite index: idx_work_orders_client_status');
      console.log('  - Added composite index: idx_work_orders_client_date');
      console.log('  - Added composite unique constraint: uq_work_orders_client_job_no');
      console.log('');
      console.log('Next step: Deploy application code changes (Phase 4)');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Phase 3 Migration: Failed');
      console.error('   Error:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Phase 3 Migration Rollback: Starting...');

      // Rollback in reverse order

      // Remove composite unique constraint on work_orders
      console.log('  - Removing composite unique constraint uq_work_orders_client_job_no...');
      await queryInterface.removeConstraint('work_orders', 'uq_work_orders_client_job_no', { transaction });

      // Remove composite indexes on work_orders
      console.log('  - Removing composite index idx_work_orders_client_date...');
      await queryInterface.removeIndex('work_orders', 'idx_work_orders_client_date', { transaction });

      console.log('  - Removing composite index idx_work_orders_client_status...');
      await queryInterface.removeIndex('work_orders', 'idx_work_orders_client_status', { transaction });

      // Restore simple index on work_orders.client_id
      console.log('  - Restoring simple index idx_work_orders_client_id...');
      await queryInterface.addIndex('work_orders', ['client_id'], {
        name: 'idx_work_orders_client_id',
        transaction
      });

      // Remove composite unique constraint on users
      console.log('  - Removing composite unique constraint uq_users_client_email...');
      await queryInterface.removeConstraint('users', 'uq_users_client_email', { transaction });

      // Remove composite index on users
      console.log('  - Removing composite index idx_users_client_role...');
      await queryInterface.removeIndex('users', 'idx_users_client_role', { transaction });

      // Restore simple index on users.client_id
      console.log('  - Restoring simple index idx_users_client_id...');
      await queryInterface.addIndex('users', ['client_id'], {
        name: 'idx_users_client_id',
        transaction
      });

      // Make client_id nullable again
      console.log('  - Making work_orders.client_id nullable...');
      await queryInterface.sequelize.query(
        `ALTER TABLE work_orders ALTER COLUMN client_id DROP NOT NULL`,
        { transaction }
      );

      console.log('  - Making users.client_id nullable...');
      await queryInterface.sequelize.query(
        `ALTER TABLE users ALTER COLUMN client_id DROP NOT NULL`,
        { transaction }
      );

      await transaction.commit();
      console.log('✅ Phase 3 Migration Rollback: Complete');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Phase 3 Migration Rollback: Failed');
      console.error('   Error:', error.message);
      throw error;
    }
  }
};
