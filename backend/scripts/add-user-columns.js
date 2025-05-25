// Create a migration script: backend/scripts/add-user-columns.js
const { sequelize } = require('../models');

const addUserColumns = async () => {
    try {
        await sequelize.authenticate();
        console.log('Adding missing columns to users table...');

        // Add organization column
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS organization VARCHAR(255) 
            DEFAULT 'VisionWest Community Trust'
        `);

        // Add account_manager_id column
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS account_manager_id INTEGER 
            REFERENCES users(id)
        `);

        console.log('✅ Columns added successfully');
    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
};

addUserColumns();