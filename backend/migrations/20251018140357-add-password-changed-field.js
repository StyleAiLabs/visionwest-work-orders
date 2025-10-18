'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'password_changed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Tracks whether user has changed their initial temporary password'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'password_changed');
  }
};
