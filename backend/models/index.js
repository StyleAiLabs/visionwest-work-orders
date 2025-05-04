const { Sequelize } = require('sequelize');
const config = require('../config/db.config.js');

// Create Sequelize instance
const sequelize = new Sequelize(
    config.DB,
    config.USER,
    config.PASSWORD,
    {
        host: config.HOST,
        dialect: config.dialect,
        pool: {
            max: config.pool.max,
            min: config.pool.min,
            acquire: config.pool.acquire,
            idle: config.pool.idle
        }
    }
);

// Initialize db object
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.user = require('./user.model.js')(sequelize, Sequelize);
db.workOrder = require('./workOrder.model.js')(sequelize, Sequelize);
db.statusUpdate = require('./statusUpdate.model.js')(sequelize, Sequelize);
db.workOrderNote = require('./workOrderNote.model.js')(sequelize, Sequelize);
db.notification = require('./notification.model.js')(sequelize, Sequelize);
db.photo = require('./photo.model.js')(sequelize, Sequelize);

// Define relationships
// User to WorkOrder relationship
db.user.hasMany(db.workOrder, { foreignKey: 'created_by', as: 'createdWorkOrders' });
db.workOrder.belongsTo(db.user, { foreignKey: 'created_by', as: 'creator' });

// User to StatusUpdate relationship
db.user.hasMany(db.statusUpdate, { foreignKey: 'updated_by', as: 'statusUpdates' });
db.statusUpdate.belongsTo(db.user, { foreignKey: 'updated_by', as: 'updater' });

// User to WorkOrderNote relationship
db.user.hasMany(db.workOrderNote, { foreignKey: 'created_by', as: 'notes' });
db.workOrderNote.belongsTo(db.user, { foreignKey: 'created_by', as: 'creator' });

// User to Photo relationship
db.user.hasMany(db.photo, { foreignKey: 'uploaded_by', as: 'uploads' });
db.photo.belongsTo(db.user, { foreignKey: 'uploaded_by', as: 'uploader' });

// User to Notification relationship
db.user.hasMany(db.notification, { foreignKey: 'user_id' });
db.notification.belongsTo(db.user, { foreignKey: 'user_id' });

// WorkOrder to StatusUpdate relationship
db.workOrder.hasMany(db.statusUpdate, { foreignKey: 'work_order_id', as: 'statusUpdates' });
db.statusUpdate.belongsTo(db.workOrder, { foreignKey: 'work_order_id' });

// WorkOrder to WorkOrderNote relationship
db.workOrder.hasMany(db.workOrderNote, { foreignKey: 'work_order_id', as: 'notes' });
db.workOrderNote.belongsTo(db.workOrder, { foreignKey: 'work_order_id' });

// WorkOrder to Photo relationship
db.workOrder.hasMany(db.photo, { foreignKey: 'work_order_id', as: 'photos' });
db.photo.belongsTo(db.workOrder, { foreignKey: 'work_order_id' });

// WorkOrder to Notification relationship
db.workOrder.hasMany(db.notification, { foreignKey: 'work_order_id' });
db.notification.belongsTo(db.workOrder, { foreignKey: 'work_order_id' });

module.exports = db;