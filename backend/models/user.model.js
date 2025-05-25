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
            unique: true,
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
        }
    }, {
        timestamps: true,

    });

    return User;
};