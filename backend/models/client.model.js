module.exports = (sequelize, DataTypes) => {
    const Client = sequelize.define('client', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                isUppercase: true,
                is: /^[A-Z0-9_]+$/
            }
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'active',
            validate: {
                isIn: [['active', 'inactive', 'archived']]
            }
        },
        primary_contact_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        primary_contact_email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        primary_contact_phone: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        settings: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        }
    }, {
        timestamps: true,
        underscored: true,
        tableName: 'clients'
    });

    return Client;
};
