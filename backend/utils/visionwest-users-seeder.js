const bcrypt = require('bcryptjs');
const db = require('../models');
const User = db.user;
const WorkOrder = db.workOrder;

const seedVisionWestUsers = async () => {
    try {
        console.log('Setting up VisionWest users...');

        // Check if the users already exist
        const existingHousing = await User.findOne({ where: { email: 'housing@visionwest.org.nz' } });
        const existingCameron = await User.findOne({ where: { email: 'cameron.lee@visionwest.org.nz' } });

        if (existingHousing && existingCameron) {
            console.log('VisionWest users already exist!');
            return;
        }

        // Create the housing admin user (can see all VisionWest jobs)
        let housingUser;
        if (!existingHousing) {
            housingUser = await User.create({
                username: 'housing_visionwest',
                email: 'housing@visionwest.org.nz',
                password: bcrypt.hashSync('VisionWest2025!', 8),
                role: 'client_admin', // New role for VisionWest admins
                full_name: 'VisionWest Housing Team',
                phone_number: '09 123 4567',
                organization: 'VisionWest Community Trust',
                is_active: true,
                account_manager_id: null // Admin doesn't belong to any account manager
            });
            console.log('Created housing@visionwest.org.nz user');
        } else {
            housingUser = existingHousing;
        }

        // Create Cameron Lee as an individual account manager
        let cameronUser;
        if (!existingCameron) {
            cameronUser = await User.create({
                username: 'cameron_lee',
                email: 'cameron.lee@visionwest.org.nz',
                password: bcrypt.hashSync('CameronVW2025!', 8),
                role: 'client', // Regular client role but will have filtered access
                full_name: 'Cameron Lee',
                phone_number: '09 987 6543',
                organization: 'VisionWest Community Trust',
                is_active: true,
                account_manager_id: null // Cameron is an account manager himself
            });
            console.log('Created cameron.lee@visionwest.org.nz user');
        } else {
            cameronUser = existingCameron;
        }

        // Update existing VisionWest work orders to assign them to Cameron as examples
        // (In real implementation, you'd assign based on actual business logic)
        await WorkOrder.update(
            { account_manager_id: cameronUser.id },
            {
                where: {
                    property_name: 'VisionWest Community Trust'
                }
            }
        );

        console.log('VisionWest users setup completed successfully!');
        console.log('Login credentials:');
        console.log('1. housing@visionwest.org.nz / VisionWest2025! (Admin - sees all jobs)');
        console.log('2. cameron.lee@visionwest.org.nz / CameronVW2025! (Account Manager - sees assigned jobs)');

    } catch (error) {
        console.error('Error setting up VisionWest users:', error);
        throw error;
    }
};

module.exports = seedVisionWestUsers;