module.exports = (sequelize, Sequelize) => {
    const StatusUpdate = sequelize.define('status_updates', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        work_order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'work_orders',
                key: 'id'
            }
        },
        previous_status: {
            type: Sequelize.STRING,
            allowNull: false
        },
        new_status: {
            type: Sequelize.STRING,
            allowNull: false
        },
        notes: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        updated_by: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    });

    return StatusUpdate;
};