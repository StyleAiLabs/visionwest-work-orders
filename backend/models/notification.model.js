module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define('notifications', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        work_order_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'work_orders',
                key: 'id'
            }
        },
        type: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                isIn: [['work-order', 'status-change', 'completion', 'urgent']]
            }
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        message: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        is_read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    });

    return Notification;
};