/**
 * Verify Composite Indexes and Constraints
 *
 * Purpose: Verify Phase 3 migration created all composite indexes and constraints
 */

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  logging: false
});

async function verifyIndexes() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Check users table indexes
    console.log('=== Users Table Indexes ===');
    const [usersIndexes] = await sequelize.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'users'
      AND indexname IN (
        'idx_users_client_role',
        'uq_users_client_email'
      )
      ORDER BY indexname
    `);

    usersIndexes.forEach(idx => {
      console.log(`✅ ${idx.indexname}`);
      console.log(`   ${idx.indexdef}\n`);
    });

    // Check work_orders table indexes
    console.log('=== Work Orders Table Indexes ===');
    const [workOrdersIndexes] = await sequelize.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'work_orders'
      AND indexname IN (
        'idx_work_orders_client_status',
        'idx_work_orders_client_date',
        'uq_work_orders_client_job_no'
      )
      ORDER BY indexname
    `);

    workOrdersIndexes.forEach(idx => {
      console.log(`✅ ${idx.indexname}`);
      console.log(`   ${idx.indexdef}\n`);
    });

    // Check constraints
    console.log('=== Table Constraints ===');
    const [constraints] = await sequelize.query(`
      SELECT
        table_name,
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_name IN ('users', 'work_orders')
      AND constraint_name IN (
        'uq_users_client_email',
        'uq_work_orders_client_job_no'
      )
      ORDER BY table_name, constraint_name
    `);

    constraints.forEach(c => {
      console.log(`✅ ${c.table_name}.${c.constraint_name} (${c.constraint_type})`);
    });

    console.log('\n=== Summary ===');
    console.log(`Expected users indexes: 2`);
    console.log(`Found users indexes: ${usersIndexes.length}`);
    console.log(`Expected work_orders indexes: 3`);
    console.log(`Found work_orders indexes: ${workOrdersIndexes.length}`);
    console.log(`Expected constraints: 2`);
    console.log(`Found constraints: ${constraints.length}`);

    if (usersIndexes.length === 2 && workOrdersIndexes.length === 3 && constraints.length === 2) {
      console.log('\n✅ Phase 3 verification: PASSED');
    } else {
      console.log('\n❌ Phase 3 verification: FAILED - Missing indexes or constraints');
    }

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyIndexes();
