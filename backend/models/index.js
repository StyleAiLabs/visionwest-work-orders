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

module.exports = db;