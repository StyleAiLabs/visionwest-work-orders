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
            // Note: unique constraint is client-scoped in database (client_id, job_no)
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
                isIn: [['pending', 'in-progress', 'completed', 'cancelled']]
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
        property_address: {
            type: DataTypes.TEXT,
            allowNull: true
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
        // Multi-tenant support: associate work order with a client organization
        client_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clients',
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
        // Note: work_orders table uses camelCase for timestamps
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    return WorkOrder;
};