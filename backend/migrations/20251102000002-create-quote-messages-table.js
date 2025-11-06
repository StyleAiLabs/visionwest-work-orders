'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('quote_messages', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            quote_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'quotes',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'Reference to the quote this message belongs to'
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
                comment: 'User who created this message'
            },
            message_type: {
                type: Sequelize.ENUM(
                    'comment',
                    'question',
                    'response',
                    'quote_provided',
                    'quote_updated',
                    'approved',
                    'declined_by_staff',
                    'declined_by_client',
                    'info_requested',
                    'expired',
                    'renewed',
                    'status_change'
                ),
                allowNull: false,
                defaultValue: 'comment',
                comment: 'Type/category of the message'
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'Content of the message'
            },
            previous_cost: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Previous estimated cost (for quote updates)'
            },
            new_cost: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'New estimated cost (for quote updates)'
            },
            previous_hours: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: true,
                comment: 'Previous estimated hours (for quote updates)'
            },
            new_hours: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: true,
                comment: 'New estimated hours (for quote updates)'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                comment: 'Message creation timestamp'
            }
        }, {
            comment: 'Stores messages and communication history for quote requests'
        });

        // Add indexes for efficient querying
        await queryInterface.addIndex('quote_messages', ['quote_id', 'created_at'], {
            name: 'idx_quote_messages_quote_created'
        });

        await queryInterface.addIndex('quote_messages', ['user_id'], {
            name: 'idx_quote_messages_user'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('quote_messages');
    }
};
