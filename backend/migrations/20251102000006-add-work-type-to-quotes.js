'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('quotes', 'work_type', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Type of work requested (Full property clean up, Rubbish removal, etc.)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('quotes', 'work_type');
  }
};
