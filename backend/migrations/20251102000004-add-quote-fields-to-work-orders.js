'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add created_from_quote_id field
        await queryInterface.addColumn('work_orders', 'created_from_quote_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'quotes',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Reference to the quote that was converted to this work order'
        });

        // Add quote_number field for quick reference
        await queryInterface.addColumn('work_orders', 'quote_number', {
            type: Sequelize.STRING(20),
            allowNull: true,
            comment: 'Quote reference number (format: QTE-YYYY-###) for easy identification'
        });

        // Add index for efficient lookup
        await queryInterface.addIndex('work_orders', ['created_from_quote_id'], {
            name: 'idx_work_orders_quote_id'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('work_orders', 'idx_work_orders_quote_id');
        await queryInterface.removeColumn('work_orders', 'quote_number');
        await queryInterface.removeColumn('work_orders', 'created_from_quote_id');
    }
};
