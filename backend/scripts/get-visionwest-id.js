// Suppress database config debug output
const originalLog = console.log;
const originalError = console.error;
console.log = () => {};
console.error = () => {};

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    logging: false
});

// Restore console after sequelize init
console.log = originalLog;
console.error = originalError;

(async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT id FROM clients WHERE code = 'VISIONWEST'");
        if (results.length > 0) {
            console.log(results[0].id);
        } else {
            console.error('VISIONWEST client not found');
            process.exit(1);
        }
        await sequelize.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
