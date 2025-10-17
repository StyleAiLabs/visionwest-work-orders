'use strict';

/**
 * Migration: Phase 1 - Multi-Client Support Schema Extension
 *
 * Purpose: Create clients table and add nullable client_id columns
 * Feature: Multi-Client Work Order Management
 *
 * This is Phase 1 of a 4-phase migration strategy:
 * - Phase 1: Create clients table, add nullable client_id columns
 * - Phase 2: Backfill existing data with Visionwest client (separate script)
 * - Phase 3: Make client_id NOT NULL, add composite indexes
 * - Phase 4: Deploy application code changes
 *
 * Safety: All changes are additive and non-breaking. Application continues to work.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Phase 1 Migration: Starting...');

      // Step 1: Create clients table
      console.log('  - Creating clients table...');
      await queryInterface.createTable('clients', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        status: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'active'
        },
        primary_contact_name: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        primary_contact_email: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        primary_contact_phone: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        settings: {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        }
      }, { transaction });

      // Step 2: Add check constraint for status
      console.log('  - Adding status check constraint...');
      await queryInterface.sequelize.query(
        `ALTER TABLE clients ADD CONSTRAINT chk_clients_status
         CHECK (status IN ('active', 'inactive', 'archived'))`,
        { transaction }
      );

      // Step 3: Add indexes for clients table
      console.log('  - Creating indexes on clients table...');
      await queryInterface.addIndex('clients', ['status'], {
        name: 'idx_clients_status',
        transaction
      });

      await queryInterface.addIndex('clients', ['code'], {
        name: 'idx_clients_code',
        unique: true,
        transaction
      });

      // Step 4: Insert Visionwest client
      console.log('  - Inserting Visionwest client...');
      await queryInterface.bulkInsert('clients', [{
        name: 'Visionwest',
        code: 'VISIONWEST',
        status: 'active',
        primary_contact_name: 'Admin',
        primary_contact_email: 'admin@visionwest.com',
        settings: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date()
      }], { transaction });

      // Step 5: Add nullable client_id column to users table
      console.log('  - Adding client_id column to users table...');
      await queryInterface.addColumn('users', 'client_id', {
        type: Sequelize.INTEGER,
        allowNull: true,  // Initially nullable for safe migration
        references: {
          model: 'clients',
          key: 'id'
        },
        onDelete: 'SET NULL'
      }, { transaction });

      // Step 6: Add index on users.client_id
      console.log('  - Creating index on users.client_id...');
      await queryInterface.addIndex('users', ['client_id'], {
        name: 'idx_users_client_id',
        transaction
      });

      // Step 7: Add nullable client_id column to work_orders table
      console.log('  - Adding client_id column to work_orders table...');
      // Check if column already exists (from failed previous migration)
      const [workOrdersColumns] = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'work_orders' AND column_name = 'client_id'`,
        { transaction }
      );

      if (workOrdersColumns.length === 0) {
        await queryInterface.addColumn('work_orders', 'client_id', {
          type: Sequelize.INTEGER,
          allowNull: true,  // Initially nullable for safe migration
          references: {
            model: 'clients',
            key: 'id'
          },
          onDelete: 'SET NULL'
        }, { transaction });
      } else {
        console.log('  - Column work_orders.client_id already exists, skipping...');
      }

      // Step 8: Add index on work_orders.client_id
      console.log('  - Creating index on work_orders.client_id...');
      // Check if index already exists
      const [workOrdersIndexes] = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes
         WHERE tablename = 'work_orders' AND indexname = 'idx_work_orders_client_id'`,
        { transaction }
      );

      if (workOrdersIndexes.length === 0) {
        await queryInterface.addIndex('work_orders', ['client_id'], {
          name: 'idx_work_orders_client_id',
          transaction
        });
      } else {
        console.log('  - Index idx_work_orders_client_id already exists, skipping...');
      }

      await transaction.commit();
      console.log('✅ Phase 1 Migration: Complete');
      console.log('   Next step: Run backfill script to assign existing data to Visionwest client');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Phase 1 Migration: Failed');
      console.error('   Error:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Phase 1 Migration Rollback: Starting...');

      // Rollback in reverse order
      console.log('  - Removing work_orders.client_id index...');
      await queryInterface.removeIndex('work_orders', 'idx_work_orders_client_id', { transaction });

      console.log('  - Removing work_orders.client_id column...');
      await queryInterface.removeColumn('work_orders', 'client_id', { transaction });

      console.log('  - Removing users.client_id index...');
      await queryInterface.removeIndex('users', 'idx_users_client_id', { transaction });

      console.log('  - Removing users.client_id column...');
      await queryInterface.removeColumn('users', 'client_id', { transaction });

      console.log('  - Removing clients table indexes...');
      await queryInterface.removeIndex('clients', 'idx_clients_code', { transaction });
      await queryInterface.removeIndex('clients', 'idx_clients_status', { transaction });

      console.log('  - Dropping clients table...');
      await queryInterface.dropTable('clients', { transaction });

      await transaction.commit();
      console.log('✅ Phase 1 Migration Rollback: Complete');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Phase 1 Migration Rollback: Failed');
      console.error('   Error:', error.message);
      throw error;
    }
  }
};
