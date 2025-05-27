// backend/scripts/create-sms-table.js
const { sequelize } = require('../models');

const createSMSTable = async () => {
    try {
        await sequelize.authenticate();
        console.log('Creating SMS notifications table...');

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS sms_notifications (
                id SERIAL PRIMARY KEY,
                work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
                phone_number VARCHAR(20) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
                error_message TEXT,
                sent_at TIMESTAMP,
                twilio_sid VARCHAR(100),
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ SMS notifications table created successfully');
    } catch (error) {
        console.error('❌ Error creating SMS table:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
};

createSMSTable();