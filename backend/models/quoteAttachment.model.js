module.exports = (sequelize, Sequelize) => {
    const QuoteAttachment = sequelize.define('quote_attachment', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        quote_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        file_type: {
            type: Sequelize.ENUM('photo', 'document', 'other'),
            allowNull: false,
            defaultValue: 'photo'
        },
        file_name: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        file_url: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        file_size: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        mime_type: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        uploaded_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
    }, {
        tableName: 'quote_attachments',
        timestamps: false,
        underscored: true,
        createdAt: 'uploaded_at',
        updatedAt: false
    });

    return QuoteAttachment;
};
