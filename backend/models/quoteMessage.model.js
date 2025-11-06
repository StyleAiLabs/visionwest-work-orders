module.exports = (sequelize, Sequelize) => {
    const QuoteMessage = sequelize.define('quote_message', {
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
                'status_change',
                'converted'
            ),
            allowNull: false,
            defaultValue: 'comment'
        },
        message: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        previous_cost: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true
        },
        new_cost: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true
        },
        previous_hours: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: true
        },
        new_hours: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: true
        },
        created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
    }, {
        tableName: 'quote_messages',
        timestamps: false,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    return QuoteMessage;
};
