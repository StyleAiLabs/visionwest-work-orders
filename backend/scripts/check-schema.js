/**
 * Check Database Schema Status
 *
 * Purpose: Verify current state of multi-client migration
 */

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  logging: false
});

async function checkSchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Check clients table
    const [clientsTable] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'clients'
    `);

    console.log(`Clients table: ${clientsTable.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    // Check users.client_id column
    const [usersClientId] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'client_id'
    `);

    console.log(`Users.client_id: ${usersClientId.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    if (usersClientId.length > 0) {
      console.log(`  - Nullable: ${usersClientId[0].is_nullable}`);
      console.log(`  - Type: ${usersClientId[0].data_type}`);
    }

    // Check work_orders.client_id column
    const [workOrdersClientId] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'work_orders' AND column_name = 'client_id'
    `);

    console.log(`Work_orders.client_id: ${workOrdersClientId.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    if (workOrdersClientId.length > 0) {
      console.log(`  - Nullable: ${workOrdersClientId[0].is_nullable}`);
      console.log(`  - Type: ${workOrdersClientId[0].data_type}`);
    }

    // Count Visionwest client if clients table exists
    if (clientsTable.length > 0) {
      const [clients] = await sequelize.query(`SELECT * FROM clients WHERE code = 'VISIONWEST'`);
      console.log(`\nVisionwest client: ${clients.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      if (clients.length > 0) {
        console.log(`  - ID: ${clients[0].id}`);
        console.log(`  - Name: ${clients[0].name}`);
        console.log(`  - Status: ${clients[0].status}`);
      }
    }

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
