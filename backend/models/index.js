const { Sequelize } = require('sequelize');
const config = require('../config/db.config.js');

console.log('=== SEQUELIZE CONFIG DEBUG ===');
console.log('Final config being used:');
console.log('HOST:', config.HOST);
console.log('USER:', config.USER);
console.log('PASSWORD:', config.PASSWORD ? '[HIDDEN]' : 'NOT SET');
console.log('DB:', config.DB);
console.log('dialect:', config.dialect);
console.log('===============================');

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
db.client = require('./client.model.js')(sequelize, Sequelize);
db.user = require('./user.model.js')(sequelize, Sequelize);
db.workOrder = require('./workOrder.model.js')(sequelize, Sequelize);
db.statusUpdate = require('./statusUpdate.model.js')(sequelize, Sequelize);
db.workOrderNote = require('./workOrderNote.model.js')(sequelize, Sequelize);
db.notification = require('./notification.model.js')(sequelize, Sequelize);
db.photo = require('./photo.model.js')(sequelize, Sequelize);
db.smsNotification = require('./smsNotification.model')(sequelize, Sequelize);
db.quote = require('./quote.model.js')(sequelize, Sequelize);
db.quoteMessage = require('./quoteMessage.model.js')(sequelize, Sequelize);
db.quoteAttachment = require('./quoteAttachment.model.js')(sequelize, Sequelize);

// Define relationships
// Client relationships
db.client.hasMany(db.user, { foreignKey: 'client_id', as: 'users' });
db.user.belongsTo(db.client, { foreignKey: 'client_id', as: 'client' });

db.client.hasMany(db.workOrder, { foreignKey: 'client_id', as: 'workOrders' });
db.workOrder.belongsTo(db.client, { foreignKey: 'client_id', as: 'client' });

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

// Quote relationships
// Client to Quote relationship
db.client.hasMany(db.quote, { foreignKey: 'client_id', as: 'quotes' });
db.quote.belongsTo(db.client, { foreignKey: 'client_id', as: 'client' });

// User to Quote relationship
db.user.hasMany(db.quote, { foreignKey: 'created_by', as: 'createdQuotes' });
db.quote.belongsTo(db.user, { foreignKey: 'created_by', as: 'creator' });

// Quote to QuoteMessage relationship
db.quote.hasMany(db.quoteMessage, { foreignKey: 'quote_id', as: 'messages' });
db.quoteMessage.belongsTo(db.quote, { foreignKey: 'quote_id', as: 'quote' });

// Quote to QuoteAttachment relationship
db.quote.hasMany(db.quoteAttachment, { foreignKey: 'quote_id', as: 'attachments' });
db.quoteAttachment.belongsTo(db.quote, { foreignKey: 'quote_id', as: 'quote' });

// User to QuoteMessage relationship
db.user.hasMany(db.quoteMessage, { foreignKey: 'user_id', as: 'quoteMessages' });
db.quoteMessage.belongsTo(db.user, { foreignKey: 'user_id', as: 'user' });

// User to QuoteAttachment relationship
db.user.hasMany(db.quoteAttachment, { foreignKey: 'user_id', as: 'quoteAttachments' });
db.quoteAttachment.belongsTo(db.user, { foreignKey: 'user_id', as: 'uploader' });

// Quote to WorkOrder relationship (bidirectional)
db.quote.belongsTo(db.workOrder, { foreignKey: 'converted_to_work_order_id', as: 'workOrder' });
db.workOrder.hasOne(db.quote, { foreignKey: 'converted_to_work_order_id', as: 'sourceQuote' });

// Add associations section (if not already present)
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;