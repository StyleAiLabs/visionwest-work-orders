module.exports = (sequelize, Sequelize) => {
    const QuoteReminder = sequelize.define('quote_reminder', {
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
        reminder_number: {
            type: Sequelize.INTEGER,
            allowNull: false
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
    }, {
        tableName: 'quote_reminders',
        timestamps: false,
        underscored: true
    });

    return QuoteReminder;
};
