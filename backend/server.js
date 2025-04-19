const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

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
            'https://vision-west.netlify.app' // Add your Netlify URL here
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple route for checking if the server is running
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to VisionWest Work Order Management System API' });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));

// Set port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

// Sync database (in development)
if (process.env.NODE_ENV === 'development') {
    db.sequelize.sync({ alter: true }).then(async () => {
        console.log('Database synced in development mode');
        // Seed database
        const seedDatabase = require('./utils/seeder');
        await seedDatabase();
    });
} else {
    // In production, just sync without altering existing tables
    db.sequelize.sync().then(() => {
        console.log('Database synced in production mode');
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});