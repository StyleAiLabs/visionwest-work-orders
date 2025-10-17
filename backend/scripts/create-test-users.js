/**
 * Create Test Users for Multi-Client Testing
 *
 * Creates test users under Visionwest client with known passwords
 */

const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  logging: console.log
});

async function createTestUsers() {
  try {
    console.log('=== Creating Test Users for Visionwest Client ===\n');

    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Get Visionwest client ID
    const [clients] = await sequelize.query(
      `SELECT id FROM clients WHERE code = 'VISIONWEST'`
    );

    if (clients.length === 0) {
      throw new Error('Visionwest client not found!');
    }

    const visionwestClientId = clients[0].id;
    console.log(`Found Visionwest client (ID: ${visionwestClientId})\n`);

    // Define test users with known passwords
    const testUsers = [
      {
        username: 'test_admin',
        email: 'test.admin@visionwest.org.nz',
        password: 'Test@123',
        role: 'admin',
        full_name: 'Test Admin User',
        phone_number: '021-555-0001',
        organization: 'Visionwest'
      },
      {
        username: 'test_client_admin',
        email: 'test.clientadmin@visionwest.org.nz',
        password: 'Test@123',
        role: 'client_admin',
        full_name: 'Test Client Admin User',
        phone_number: '021-555-0002',
        organization: 'Visionwest'
      },
      {
        username: 'test_staff',
        email: 'test.staff@visionwest.org.nz',
        password: 'Test@123',
        role: 'staff',
        full_name: 'Test Staff User',
        phone_number: '021-555-0003',
        organization: 'Visionwest'
      },
      {
        username: 'test_client',
        email: 'test.client@visionwest.org.nz',
        password: 'Test@123',
        role: 'client',
        full_name: 'Test Client User',
        phone_number: '021-555-0004',
        organization: 'Visionwest'
      }
    ];

    console.log('Creating test users...\n');

    for (const userData of testUsers) {
      // Check if user already exists
      const [existing] = await sequelize.query(
        `SELECT id FROM users WHERE email = :email`,
        { replacements: { email: userData.email } }
      );

      if (existing.length > 0) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(userData.password, 10);

      // Insert user
      await sequelize.query(
        `INSERT INTO users (
          username, email, password, role, full_name,
          phone_number, organization, is_active, client_id,
          "createdAt", "updatedAt"
        ) VALUES (
          :username, :email, :password, :role, :full_name,
          :phone_number, :organization, true, :client_id,
          NOW(), NOW()
        )`,
        {
          replacements: {
            ...userData,
            password: hashedPassword,
            client_id: visionwestClientId
          }
        }
      );

      console.log(`✅ Created user: ${userData.email} (role: ${userData.role})`);
      console.log(`   Password: ${userData.password}`);
    }

    console.log('\n=== Test Users Created Successfully ===');
    console.log('\nTest Credentials:');
    console.log('─────────────────────────────────────────────────────────');
    testUsers.forEach(user => {
      console.log(`${user.role.padEnd(15)} | ${user.email.padEnd(40)} | Test@123`);
    });
    console.log('─────────────────────────────────────────────────────────');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating test users:', error.message);
    process.exit(1);
  }
}

createTestUsers();
