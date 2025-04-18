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
    origin: process.env.CORS_ORIGIN,
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
const PORT = process.env.PORT || 5002;

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
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});