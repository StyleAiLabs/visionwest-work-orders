'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add compound unique index on (LOWER(email), client_id) to enforce email uniqueness within organization
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX user_email_client_idx
      ON users (LOWER(email), client_id)
      WHERE client_id IS NOT NULL;
    `);
  },

  async down (queryInterface, Sequelize) {
    // Remove the compound unique index
    await queryInterface.removeIndex('users', 'user_email_client_idx');
  }
};
