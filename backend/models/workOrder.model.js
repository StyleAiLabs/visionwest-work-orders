module.exports = (sequelize, Sequelize) => {
    const WorkOrder = sequelize.define('work_orders', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        job_no: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'in-progress', 'completed']]
            }
        },
        work_order_type: {
            type: Sequelize.STRING,
            allowNull: true
        },
        supplier_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        supplier_phone: {
            type: Sequelize.STRING,
            allowNull: true
        },
        supplier_email: {
            type: Sequelize.STRING,
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        property_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        property_phone: {
            type: Sequelize.STRING,
            allowNull: true
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        po_number: {
            type: Sequelize.STRING,
            allowNull: true
        },
        authorized_by: {
            type: Sequelize.STRING,
            allowNull: true
        },
        authorized_contact: {
            type: Sequelize.STRING,
            allowNull: true
        },
        authorized_email: {
            type: Sequelize.STRING,
            allowNull: true
        },
        created_by: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    return WorkOrder;
};