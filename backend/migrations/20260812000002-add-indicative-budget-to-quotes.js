'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('quotes', 'indicative_budget', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            after: 'scope_of_work'
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('quotes', 'indicative_budget');
    }
};
