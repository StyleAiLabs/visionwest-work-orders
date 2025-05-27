// backend/models/smsNotification.model.js
module.exports = (sequelize, DataTypes) => {
    const SMSNotification = sequelize.define('sms_notifications', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        work_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'work_orders',
                key: 'id'
            }
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('sent', 'failed', 'pending'),
            defaultValue: 'pending'
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        sent_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        twilio_sid: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        timestamps: true,
        tableName: 'sms_notifications'
    });

    SMSNotification.associate = function (models) {
        SMSNotification.belongsTo(models.workOrder, {
            foreignKey: 'work_order_id',
            as: 'workOrder'
        });
    };

    return SMSNotification;
};