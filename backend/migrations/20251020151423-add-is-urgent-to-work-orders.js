'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('work_orders', 'is_urgent', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indicates if the work order requires urgent attention'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('work_orders', 'is_urgent');
    }
};

