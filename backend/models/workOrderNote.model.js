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
        }
    }, {
        timestamps: true,
        createdAt: 'created_at', // Map JavaScript createdAt to DB created_at
        updatedAt: 'updated_at'  // Map JavaScript updatedAt to DB updated_at
    });

    return WorkOrderNote;
};