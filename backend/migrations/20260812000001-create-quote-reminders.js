'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('quote_reminders', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            quote_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'quotes', key: 'id' },
                onDelete: 'CASCADE'
            },
            reminder_number: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: '1 = 4h reminder, 2 = 24h reminder'
            },
            scheduled_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            sent_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            cancelled_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('quote_reminders', ['quote_id']);
        await queryInterface.addIndex('quote_reminders', ['scheduled_at']);
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('quote_reminders');
    }
};
