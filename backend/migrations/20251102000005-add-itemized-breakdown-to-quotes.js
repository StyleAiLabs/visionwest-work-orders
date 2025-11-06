'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('quotes', 'itemized_breakdown', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Itemized cost breakdown (materials, labor, subcontractor costs)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('quotes', 'itemized_breakdown');
  }
};
