'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('quotes', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            quote_number: {
                type: Sequelize.STRING(20),
                allowNull: false,
                unique: true,
                comment: 'Unique quote reference number (format: QTE-YYYY-###)'
            },
            client_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'clients',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
                comment: 'Reference to the client organization'
            },
            status: {
                type: Sequelize.ENUM(
                    'Draft',
                    'Submitted',
                    'Information Requested',
                    'Quoted',
                    'Under Discussion',
                    'Approved',
                    'Declined',
                    'Expired',
                    'Converted'
                ),
                allowNull: false,
                defaultValue: 'Draft',
                comment: 'Current status of the quote request'
            },
            property_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Name or identifier of the property'
            },
            property_address: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'Full address of the property'
            },
            property_phone: {
                type: Sequelize.STRING(50),
                allowNull: true,
                comment: 'Contact phone number for the property'
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Brief title of the quote request'
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'Detailed description of work required (min 20 characters)'
            },
            scope_of_work: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Detailed scope of work specifications'
            },
            contact_person: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Name of the contact person for this quote'
            },
            contact_email: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Email address of the contact person'
            },
            contact_phone: {
                type: Sequelize.STRING(50),
                allowNull: true,
                comment: 'Phone number of the contact person'
            },
            is_urgent: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Indicates if the quote request is urgent'
            },
            required_by_date: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Date by which the quote is required'
            },
            estimated_cost: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Estimated cost provided by staff (in dollars)'
            },
            estimated_hours: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: true,
                comment: 'Estimated hours required for the work'
            },
            quote_notes: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Additional notes and terms for the quote'
            },
            quote_valid_until: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Date until which the quote is valid (default: +30 days from quote provision)'
            },
            quoted_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Timestamp when the quote was provided by staff'
            },
            approved_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Timestamp when the quote was approved by client'
            },
            declined_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Timestamp when the quote was declined'
            },
            converted_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Timestamp when the quote was converted to a work order'
            },
            converted_to_work_order_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'work_orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
                comment: 'Reference to the work order created from this quote'
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
                comment: 'User who created this quote request'
            },
            submitted_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Timestamp when the quote was submitted for review'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                comment: 'Record creation timestamp'
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                comment: 'Record last update timestamp'
            }
        }, {
            comment: 'Stores quote requests from clients for maintenance work requiring cost assessment'
        });

        // Add indexes (will be formalized in T008)
        await queryInterface.addIndex('quotes', ['client_id', 'status'], {
            name: 'idx_quotes_client_status'
        });

        await queryInterface.addIndex('quotes', ['quote_number'], {
            name: 'idx_quotes_quote_number',
            unique: true
        });

        await queryInterface.addIndex('quotes', ['created_by'], {
            name: 'idx_quotes_created_by'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('quotes');
    }
};
