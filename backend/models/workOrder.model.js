module.exports = (sequelize, DataTypes) => {
    const WorkOrder = sequelize.define('work_orders', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        job_no: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'in-progress', 'completed']]
            }
        },
        work_order_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        supplier_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        supplier_phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        supplier_email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        property_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        property_phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        po_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        authorized_by: {
            type: DataTypes.STRING,
            allowNull: true
        },
        authorized_contact: {
            type: DataTypes.STRING,
            allowNull: true
        },
        authorized_email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        client_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    return WorkOrder;
};