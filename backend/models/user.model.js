module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            // Note: unique constraint is client-scoped in database (client_id, email)
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('client', 'client_admin', 'staff', 'admin'),
            allowNull: false,
            defaultValue: 'client'
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        organization: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'VisionWest Community Trust'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        // Add field to track which account manager this user belongs to
        account_manager_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        // Multi-tenant support: associate user with a client organization
        client_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clients',
                key: 'id'
            }
        },
        // Track whether user has changed their initial temporary password
        password_changed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Tracks whether user has changed their initial temporary password'
        }
    }, {
        timestamps: true,
        // Note: We added underscored: true for client_id consistency,
        // but the users table already uses camelCase for timestamps
        // so we need to explicitly define the timestamp field names
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    return User;
};