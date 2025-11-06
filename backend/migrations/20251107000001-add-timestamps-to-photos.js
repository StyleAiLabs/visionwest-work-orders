'use strict';

/**
 * Migration: Add timestamps to photos table
 *
 * Purpose: Add createdAt and updatedAt columns to photos table for consistency
 *          with other models and to fix 500 errors in production
 *
 * Issue: Photo model expects timestamps but table doesn't have them
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Adding timestamps to photos table...');

      // Check if createdAt column exists
      const tableDescription = await queryInterface.describeTable('photos');

      if (!tableDescription.createdAt) {
        console.log('  - Adding createdAt column...');
        await queryInterface.addColumn(
          'photos',
          'createdAt',
          {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          { transaction }
        );
      } else {
        console.log('  - createdAt column already exists, skipping...');
      }

      if (!tableDescription.updatedAt) {
        console.log('  - Adding updatedAt column...');
        await queryInterface.addColumn(
          'photos',
          'updatedAt',
          {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          { transaction }
        );
      } else {
        console.log('  - updatedAt column already exists, skipping...');
      }

      await transaction.commit();
      console.log('✅ Successfully added timestamps to photos table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding timestamps to photos table:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Removing timestamps from photos table...');

      const tableDescription = await queryInterface.describeTable('photos');

      if (tableDescription.createdAt) {
        console.log('  - Removing createdAt column...');
        await queryInterface.removeColumn('photos', 'createdAt', { transaction });
      }

      if (tableDescription.updatedAt) {
        console.log('  - Removing updatedAt column...');
        await queryInterface.removeColumn('photos', 'updatedAt', { transaction });
      }

      await transaction.commit();
      console.log('✅ Successfully removed timestamps from photos table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing timestamps from photos table:', error);
      throw error;
    }
  }
};
