'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('quote_attachments', {
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
                comment: 'Reference to the quote this attachment belongs to'
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
                comment: 'User who uploaded this attachment'
            },
            file_type: {
                type: Sequelize.ENUM('photo', 'document', 'other'),
                allowNull: false,
                defaultValue: 'photo',
                comment: 'Type of file (photo, document, etc.)'
            },
            file_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Original filename of the uploaded file'
            },
            file_url: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'S3 URL or storage path for the file'
            },
            file_size: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'File size in bytes'
            },
            mime_type: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'MIME type of the file (e.g., image/jpeg, application/pdf)'
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Optional description or caption for the attachment'
            },
            uploaded_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                comment: 'Timestamp when the file was uploaded'
            }
        }, {
            comment: 'Stores file attachments (photos, documents) for quote requests'
        });

        // Add indexes for efficient querying
        await queryInterface.addIndex('quote_attachments', ['quote_id'], {
            name: 'idx_quote_attachments_quote'
        });

        await queryInterface.addIndex('quote_attachments', ['user_id'], {
            name: 'idx_quote_attachments_user'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('quote_attachments');
    }
};
