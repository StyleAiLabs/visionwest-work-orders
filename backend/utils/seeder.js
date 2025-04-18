const bcrypt = require('bcryptjs');
const db = require('../models');
const User = db.user;

const seedDatabase = async () => {
    try {
        // Check if users already exist
        const usersCount = await User.count();

        if (usersCount > 0) {
            console.log('Database already has users, skipping seeding');
            return;
        }

        // Create test users
        const users = [
            {
                username: 'visionwestuser',
                email: 'client@visionwest.org',
                password: bcrypt.hashSync('password123', 8),
                role: 'client',
                full_name: 'VisionWest Property Manager',
                phone_number: '021 123 4567',
                is_active: true
            },
            {
                username: 'williamsadmin',
                email: 'admin@williamspropertyservices.co.nz',
                password: bcrypt.hashSync('password123', 8),
                role: 'admin',
                full_name: 'Williams Property Admin',
                phone_number: '022 345 6789',
                is_active: true
            },
            {
                username: 'williamsstaff',
                email: 'staff@williamspropertyservices.co.nz',
                password: bcrypt.hashSync('password123', 8),
                role: 'staff',
                full_name: 'Williams Property Staff',
                phone_number: '027 987 6543',
                is_active: true
            }
        ];

        // Insert users
        await User.bulkCreate(users);

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Seeding error:', error);
    }
};

module.exports = seedDatabase;