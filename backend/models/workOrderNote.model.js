module.exports = (sequelize, Sequelize) => {
    const WorkOrderNote = sequelize.define('work_order_notes', {
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
        note: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        created_by: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    });

    return WorkOrderNote;
};