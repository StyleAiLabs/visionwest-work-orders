module.exports = (sequelize, Sequelize) => {
    const WorkOrderNote = sequelize.define("work_order_notes", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        note: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        work_order_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        created_by: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: true
    });

    return WorkOrderNote;
};