const bcrypt = require('bcryptjs');
const db = require('../models');
const User = db.user;
const WorkOrder = db.workOrder;
const StatusUpdate = db.statusUpdate;
const WorkOrderNote = db.workOrderNote;
const Notification = db.notification;
const seedVisionWestUsers = require('./visionwest-users-seeder');

const seedDatabase = async () => {
    try {
        // Check if users already exist
        const usersCount = await User.count();

        if (usersCount === 0) {
            console.log('Seeding users...');

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
            const createdUsers = await User.bulkCreate(users);
            console.log('Users seeded successfully!');

            // Check if work orders already exist
            const workOrdersCount = await WorkOrder.count();

            if (workOrdersCount === 0) {
                console.log('Seeding work orders...');

                // Create sample work orders
                const workOrders = [
                    {
                        job_no: 'RBWO010965',
                        date: new Date('2025-04-04'),
                        status: 'pending',
                        supplier_name: 'Williams Property Services',
                        supplier_phone: '0275 888 000',
                        supplier_email: 'info@williamspropertyservices.co.nz',
                        property_name: 'VisionWest Community Trust',
                        property_phone: '021 352 190',
                        description: 'Cleaning rubbish/debris off the roof to determine cause of leak. Tenants are aware of the visit.',
                        po_number: 'PO120327',
                        authorized_by: 'Danell Anderson',
                        authorized_contact: '022 015 9961',
                        authorized_email: 'danell.anderson@visionwest.org.nz',
                        created_by: createdUsers[1].id // Williams Admin
                    },
                    {
                        job_no: 'RBWO010943',
                        date: new Date('2025-04-03'),
                        status: 'in-progress',
                        supplier_name: 'Williams Property Services',
                        supplier_phone: '0275 888 000',
                        supplier_email: 'info@williamspropertyservices.co.nz',
                        property_name: 'VisionWest Community Trust',
                        property_phone: '021 352 190',
                        description: 'Fix broken window in living room. Temporary repairs done, waiting for replacement glass.',
                        po_number: 'PO120315',
                        authorized_by: 'James Wilson',
                        authorized_contact: '022 987 6543',
                        authorized_email: 'james.wilson@visionwest.org.nz',
                        created_by: createdUsers[1].id // Williams Admin
                    },
                    {
                        job_no: 'RBWO010932',
                        date: new Date('2025-04-02'),
                        status: 'completed',
                        supplier_name: 'Williams Property Services',
                        supplier_phone: '0275 888 000',
                        supplier_email: 'info@williamspropertyservices.co.nz',
                        property_name: 'VisionWest Community Trust',
                        property_phone: '021 352 190',
                        description: 'Replace faulty smoke detector in hallway. New detector installed and tested.',
                        po_number: 'PO120301',
                        authorized_by: 'Danell Anderson',
                        authorized_contact: '022 015 9961',
                        authorized_email: 'danell.anderson@visionwest.org.nz',
                        created_by: createdUsers[1].id // Williams Admin
                    }
                ];

                // Insert work orders
                const createdWorkOrders = await WorkOrder.bulkCreate(workOrders);
                console.log('Work orders seeded successfully!');

                // Create some status updates
                const statusUpdates = [
                    {
                        work_order_id: createdWorkOrders[1].id, // RBWO010943
                        previous_status: 'pending',
                        new_status: 'in-progress',
                        notes: 'Started temporary repairs to secure the broken window.',
                        updated_by: createdUsers[2].id // Williams Staff
                    },
                    {
                        work_order_id: createdWorkOrders[2].id, // RBWO010932
                        previous_status: 'pending',
                        new_status: 'in-progress',
                        notes: 'Technician on site to replace smoke detector.',
                        updated_by: createdUsers[2].id // Williams Staff
                    },
                    {
                        work_order_id: createdWorkOrders[2].id, // RBWO010932
                        previous_status: 'in-progress',
                        new_status: 'completed',
                        notes: 'Smoke detector replaced and tested successfully.',
                        updated_by: createdUsers[2].id // Williams Staff
                    }
                ];

                await StatusUpdate.bulkCreate(statusUpdates);
                console.log('Status updates seeded successfully!');

                // Create some work order notes
                const workOrderNotes = [
                    {
                        work_order_id: createdWorkOrders[0].id, // RBWO010965
                        note: 'Called tenant to confirm appointment for roof inspection.',
                        created_by: createdUsers[2].id // Williams Staff
                    },
                    {
                        work_order_id: createdWorkOrders[1].id, // RBWO010943
                        note: 'Ordered replacement glass, expected to arrive in 2-3 days.',
                        created_by: createdUsers[2].id // Williams Staff
                    },
                    {
                        work_order_id: createdWorkOrders[2].id, // RBWO010932
                        note: 'All work completed and tested according to requirements.',
                        created_by: createdUsers[2].id // Williams Staff
                    }
                ];

                await WorkOrderNote.bulkCreate(workOrderNotes);
                console.log('Work order notes seeded successfully!');

                // Create notifications for each user
                const clientNotifications = [
                    {
                        user_id: createdUsers[0].id, // VisionWest user
                        work_order_id: createdWorkOrders[0].id,
                        type: 'work-order',
                        title: 'New Work Order Created',
                        message: `Job #${createdWorkOrders[0].job_no} has been created for roof inspection.`,
                        is_read: false,
                        created_at: new Date('2025-04-04T10:00:00')
                    },
                    {
                        user_id: createdUsers[0].id, // VisionWest user
                        work_order_id: createdWorkOrders[1].id,
                        type: 'status-change',
                        title: 'Work Order Status Updated',
                        message: `Job #${createdWorkOrders[1].job_no} status changed from Pending to In Progress.`,
                        is_read: true,
                        created_at: new Date('2025-04-03T14:30:00')
                    },
                    {
                        user_id: createdUsers[0].id, // VisionWest user
                        work_order_id: createdWorkOrders[2].id,
                        type: 'completion',
                        title: 'Work Order Completed',
                        message: `Job #${createdWorkOrders[2].job_no} has been marked as completed.`,
                        is_read: false,
                        created_at: new Date('2025-04-02T16:45:00')
                    }
                ];

                const staffNotifications = [
                    {
                        user_id: createdUsers[2].id, // Williams Staff
                        work_order_id: createdWorkOrders[0].id,
                        type: 'work-order',
                        title: 'New Work Order Assigned',
                        message: `Job #${createdWorkOrders[0].job_no} has been assigned to you.`,
                        is_read: false,
                        created_at: new Date('2025-04-04T10:15:00')
                    },
                    {
                        user_id: createdUsers[2].id, // Williams Staff
                        work_order_id: createdWorkOrders[1].id,
                        type: 'urgent',
                        title: 'Urgent: Action Required',
                        message: `Job #${createdWorkOrders[1].job_no} requires immediate attention.`,
                        is_read: true,
                        created_at: new Date('2025-04-03T09:20:00')
                    }
                ];

                await Notification.bulkCreate([...clientNotifications, ...staffNotifications]);
                console.log('Notifications seeded successfully!');
            }
        } else {
            console.log('Database already has users, skipping seeding');
        }

        await seedVisionWestUsers();

        console.log('Database seeding completed successfully!');
    } catch (error) {
        console.error('Seeding error:', error);
    }
};

module.exports = seedDatabase;