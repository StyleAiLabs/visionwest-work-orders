const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

// Initialize database connection
const db = require('./models');
// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            process.env.CORS_ORIGIN,
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'https://vision-west.netlify.app', // staging
            'https://prod-wom-visionwest.netlify.app', //production
            'https://visionwest.wom.wpsg.nz' // production
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
}));

// IMPORTANT: Body parser middleware must be configured before routes
app.use(express.json());  // For parsing application/json
app.use(express.urlencoded({ extended: true }));  // For parsing application/x-www-form-urlencoded

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple route for checking if the server is running
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to VisionWest Work Order Management System API' });
});

// Public webhook test endpoint (no authentication required)
app.post('/api/webhook/test-sms', async (req, res) => {
    try {
        console.log('📱 Webhook SMS test endpoint called');
        console.log('Request body:', req.body);

        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }

        const smsService = require('./services/smsService');
        const result = await smsService.sendSMS(phoneNumber, message);

        return res.status(200).json({
            success: true,
            data: result,
            message: result.success ? 'SMS webhook sent successfully' : 'SMS webhook failed'
        });
    } catch (error) {
        console.error('Error testing SMS webhook:', error);
        return res.status(500).json({
            success: false,
            message: 'Error testing SMS webhook',
            error: error.message
        });
    }
});

// Public SMS webhook test (for testing only)
app.post('/api/public/test-sms', async (req, res) => {
    try {
        // Add basic security check (optional)
        // const testKey = req.headers['x-test-key'];
        // if (testKey !== 'visionwest-test-2024') {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Invalid test key. Use header: x-test-key: visionwest-test-2024'
        //     });
        // }

        console.log('📱 Public SMS test endpoint called');
        console.log('Request body:', req.body);

        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }

        const smsService = require('./services/smsService');
        const result = await smsService.sendSMS(phoneNumber, message);

        return res.status(200).json({
            success: true,
            data: result,
            message: result.success ? 'SMS webhook sent successfully' : 'SMS webhook failed',
            webhook_url: smsService.webhookUrl || 'https://autopilot-prod.thesafetycabinetwarehouse.com/webhook-test/17345d58-c722-451c-9917-d48b7cd04cbf'
        });
    } catch (error) {
        console.error('Error testing SMS webhook:', error);
        return res.status(500).json({
            success: false,
            message: 'Error testing SMS webhook',
            error: error.message
        });
    }
});

// Public endpoint info
app.get('/api/public/sms-info', (req, res) => {
    res.json({
        success: true,
        message: 'SMS webhook service info',
        endpoints: {
            test: '/api/public/test-sms',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-test-key': 'visionwest-test-2024'
            },
            body: {
                phoneNumber: '+64225710164',
                message: 'Your test message'
            }
        },
        webhook_url: 'https://autopilot-prod.thesafetycabinetwarehouse.com/webhook-test/17345d58-c722-451c-9917-d48b7cd04cbf'
    });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/work-orders', require('./routes/workOrder.routes'));
app.use('/api/notes', require('./routes/notes.routes'));
app.use('/api/alerts', require('./routes/notification.routes'));
app.use('/api/photos', require('./routes/photo.routes'));
app.use('/api/webhook', require('./routes/webhook.routes'));
app.use('/api/export', require('./routes/export.routes'));
app.use('/api/app', require('./routes/app.routes'));
app.use('/api/clients', require('./routes/client.routes'));

// Import routes
const notesRoutes = require('./routes/notes.routes');

// Use routes
app.use('/api', notesRoutes);  // This will make the routes available at /api/work-orders/:workOrderId/notes

// Error handling middleware
app.use(require('./middleware/error.middleware'));

// Set port
const PORT = process.env.PORT || 5002;

// Sync database and seed data
const initializeDatabase = async () => {
    try {
        if (process.env.NODE_ENV === 'development') {
            await db.sequelize.sync({ alter: true });
            console.log('Database synced in development mode');

            // Seed database in both environments
            //const seedDatabase = require('./utils/seeder');
            //await seedDatabase();
            //console.log('Database seeded successfully');

        } else {
            await db.sequelize.sync();
            console.log('Database synced in production mode');
        }


    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};

// Start server and initialize database
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}.`);
    await initializeDatabase();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

// Add this to your backend/server.js for testing
app.post('/api/test-sms-manual', async (req, res) => {
    try {
        const smsService = require('./services/smsService');

        // Test with a sample work order
        const testWorkOrder = {
            job_no: 'TEST123',
            property_name: '123 Test Street',
            authorized_email: 'test@visionwest.org.nz',
            authorized_contact: '+64211234567',
            authorized_by: 'Test User'
        };

        const result = await smsService.sendWorkOrderStatusSMS(
            testWorkOrder,
            'pending',
            'in-progress',
            'staff'
        );

        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});