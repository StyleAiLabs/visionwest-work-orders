// backend/scripts/create-visionwest-users.js
const bcrypt = require('bcryptjs');
const { sequelize } = require('../models');
const db = require('../models');
const User = db.user;

const createVisionWestUsers = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Check if users already exist
        const existingHousing = await User.findOne({
            where: { email: 'housing@visionwest.org.nz' }
        });
        const existingCameron = await User.findOne({
            where: { email: 'cameron.lee@visionwest.org.nz' }
        });

        if (existingHousing) {
            console.log('housing@visionwest.org.nz already exists');
        } else {
            await User.create({
                username: 'housing_visionwest',
                email: 'housing@visionwest.org.nz',
                password: bcrypt.hashSync('VisionWest2025!', 8),
                role: 'client_admin',
                full_name: 'VisionWest Housing Team',
                phone_number: '09 123 4567',
                organization: 'VisionWest Community Trust',
                is_active: true
            });
            console.log('✓ Created housing@visionwest.org.nz');
        }

        if (existingCameron) {
            console.log('cameron.lee@visionwest.org.nz already exists');
        } else {
            await User.create({
                username: 'cameron_lee',
                email: 'cameron.lee@visionwest.org.nz',
                password: bcrypt.hashSync('CameronVW2025!', 8),
                role: 'client',
                full_name: 'Cameron Lee',
                phone_number: '09 987 6543',
                organization: 'VisionWest Community Trust',
                is_active: true
            });
            console.log('✓ Created cameron.lee@visionwest.org.nz');
        }

        console.log('\nLogin credentials:');
        console.log('1. housing@visionwest.org.nz / VisionWest2025!');
        console.log('2. cameron.lee@visionwest.org.nz / CameronVW2025!');

    } catch (error) {
        console.error('Error creating VisionWest users:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
};

createVisionWestUsers();