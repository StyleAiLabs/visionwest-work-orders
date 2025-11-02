'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'converted' value to the enum_quote_messages_message_type enum
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_quote_messages_message_type ADD VALUE IF NOT EXISTS 'converted';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum and updating all references
    console.log('Warning: Cannot remove enum value in PostgreSQL. Manual intervention required.');
  }
};
