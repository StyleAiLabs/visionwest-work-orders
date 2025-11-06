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
            'https://vision-west.netlify.app', // dev branch (vision west only)
            'https://demo.wom.wpsg.nz', // dev branch staging - official
            'https://prod-wom-visionwest.netlify.app', // legacy production
            'https://visionwest.wom.wpsg.nz', // main branch production (vision west only)
            'https://app.wom.wpsg.nz' // main branch production - official
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

// Database Health Check Endpoint (public - no auth required)
app.get('/api/health/db', async (req, res) => {
    try {
        console.log('🏥 Database health check requested');
        console.log('Attempting to connect to:', process.env.DB_HOST);

        // Test basic connectivity
        await db.sequelize.authenticate();
        console.log('✅ Authentication successful');

        // Test query execution
        const result = await db.sequelize.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✅ Query execution successful');

        // Get pool status
        const pool = db.sequelize.connectionManager.pool;
        const poolStatus = pool ? {
            size: pool.size,
            available: pool.available,
            using: pool.using,
            waiting: pool.waiting
        } : 'Pool not available';

        res.json({
            success: true,
            message: 'Database connection is healthy',
            timestamp: result[0][0].current_time,
            postgresVersion: result[0][0].pg_version,
            connection: {
                host: process.env.DB_HOST,
                database: process.env.DB_NAME,
                user: process.env.DB_USER
            },
            pool: poolStatus
        });
    } catch (error) {
        console.error('❌ Database health check failed:', error);
        console.error('Error details:', {
            code: error.code || error.original?.code,
            errno: error.errno || error.original?.errno,
            syscall: error.syscall || error.original?.syscall,
            address: error.address || error.original?.address,
            port: error.port || error.original?.port
        });

        res.status(503).json({
            success: false,
            message: 'Database connection failed',
            error: {
                message: error.message,
                code: error.code || error.original?.code,
                errno: error.errno || error.original?.errno,
                syscall: error.syscall || error.original?.syscall,
                address: error.address || error.original?.address,
                port: error.port || error.original?.port
            },
            connection: {
                host: process.env.DB_HOST,
                database: process.env.DB_NAME,
                user: process.env.DB_USER
            }
        });
    }
});

// Network Diagnostic Endpoint
app.get('/api/health/network', async (req, res) => {
    const net = require('net');
    const dns = require('dns').promises;

    const diagnostics = {
        timestamp: new Date().toISOString(),
        renderInfo: {
            outboundIP: null,
            region: process.env.RENDER_REGION || 'unknown',
            service: process.env.RENDER_SERVICE_NAME || 'unknown'
        },
        databaseTarget: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432
        },
        tests: {}
    };

    try {
        // Get Render's outbound IP
        const https = require('https');
        const ipPromise = new Promise((resolve, reject) => {
            https.get('https://api.ipify.org?format=json', (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try {
                        diagnostics.renderInfo.outboundIP = JSON.parse(data).ip;
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });

        await ipPromise;

        // Test DNS resolution
        try {
            const addresses = await dns.resolve4(process.env.DB_HOST);
            diagnostics.tests.dns = {
                success: true,
                resolvedIPs: addresses,
                message: `Resolved ${process.env.DB_HOST} to ${addresses.join(', ')}`
            };
        } catch (dnsError) {
            diagnostics.tests.dns = {
                success: false,
                error: dnsError.message,
                code: dnsError.code
            };
        }

        // Test TCP connection to database port
        const testTcpConnection = () => {
            return new Promise((resolve) => {
                const socket = new net.Socket();
                const timeout = 10000;

                socket.setTimeout(timeout);

                socket.on('connect', () => {
                    socket.destroy();
                    resolve({
                        success: true,
                        message: `Port ${process.env.DB_PORT || 5432} is reachable`,
                        latency: Date.now() - startTime
                    });
                });

                socket.on('timeout', () => {
                    socket.destroy();
                    resolve({
                        success: false,
                        error: 'Connection timeout',
                        message: `Port ${process.env.DB_PORT || 5432} is blocked or unreachable`,
                        possibleCauses: [
                            'Render firewall blocking outbound connection',
                            'SiteGround firewall blocking Render IP',
                            'Database server not running',
                            'Incorrect host/port configuration'
                        ]
                    });
                });

                socket.on('error', (error) => {
                    socket.destroy();
                    resolve({
                        success: false,
                        error: error.message,
                        code: error.code,
                        syscall: error.syscall
                    });
                });

                const startTime = Date.now();
                socket.connect(
                    process.env.DB_PORT || 5432,
                    process.env.DB_HOST
                );
            });
        };

        diagnostics.tests.tcpConnection = await testTcpConnection();

        // Test common PostgreSQL ports
        const testAlternatePorts = async () => {
            const ports = [5432, 5433, 5431];
            const results = {};

            for (const port of ports) {
                const testPort = () => {
                    return new Promise((resolve) => {
                        const socket = new net.Socket();
                        socket.setTimeout(3000);

                        socket.on('connect', () => {
                            socket.destroy();
                            resolve({ open: true });
                        });

                        socket.on('timeout', () => {
                            socket.destroy();
                            resolve({ open: false, reason: 'timeout' });
                        });

                        socket.on('error', () => {
                            socket.destroy();
                            resolve({ open: false, reason: 'refused' });
                        });

                        socket.connect(port, process.env.DB_HOST);
                    });
                };

                results[`port_${port}`] = await testPort();
            }

            return results;
        };

        diagnostics.tests.alternatePorts = await testAlternatePorts();

        // Overall health
        diagnostics.overall = {
            canReachDatabase: diagnostics.tests.tcpConnection?.success || false,
            dnsWorking: diagnostics.tests.dns?.success || false,
            recommendation: diagnostics.tests.tcpConnection?.success
                ? 'Database port is reachable. Connection issue may be SSL/authentication related.'
                : 'Cannot reach database port. Check firewall rules and IP whitelisting.'
        };

        res.json(diagnostics);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            diagnostics
        });
    }
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
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/quotes', require('./routes/quote.routes'));

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
            // Temporarily disabled sync to avoid schema alteration errors
            // await db.sequelize.sync();
            console.log('Database sync skipped in production mode');
        }

        // Add connection pool monitoring in production
        if (process.env.NODE_ENV === 'production') {
            const monitorConnectionPool = () => {
                try {
                    const pool = db.sequelize.connectionManager.pool;
                    if (pool) {
                        console.log('📊 Connection Pool Status:');
                        console.log(`   - Size: ${pool.size}`);
                        console.log(`   - Available: ${pool.available}`);
                        console.log(`   - Using: ${pool.using}`);
                        console.log(`   - Waiting: ${pool.waiting}`);
                    }
                } catch (error) {
                    console.error('Error monitoring pool:', error.message);
                }
            };

            // Log pool status every 5 minutes
            setInterval(monitorConnectionPool, 5 * 60 * 1000);

            // Log initial pool status
            setTimeout(monitorConnectionPool, 5000);
        }

    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};

// Start server first (binds to port immediately for Render), then initialize database
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}.`);
    console.log('Initializing database...');
    initializeDatabase().catch((error) => {
        console.error('Database initialization failed:', error);
        process.exit(1);
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing database connections gracefully...');
    try {
        await db.sequelize.close();
        console.log('Database connections closed');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, closing database connections gracefully...');
    try {
        await db.sequelize.close();
        console.log('Database connections closed');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
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