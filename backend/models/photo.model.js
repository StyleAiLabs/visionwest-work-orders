module.exports = (sequelize, Sequelize) => {
    const Photo = sequelize.define('photos', {
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
        file_path: {
            type: Sequelize.STRING,
            allowNull: false
        },
        file_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        uploaded_by: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        timestamps: true,  // Re-enabled - production DB already has these columns with NOT NULL
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    return Photo;
};