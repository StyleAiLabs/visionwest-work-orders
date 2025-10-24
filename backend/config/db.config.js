// -- Staging --
console.log('=== DATABASE CONFIG DEBUG ===');
console.log('DB_HOST from env:', process.env.DB_HOST);
console.log('DB_USER from env:', process.env.DB_USER);
console.log('DB_PASSWORD from env:', process.env.DB_PASSWORD ? '[HIDDEN]' : 'NOT SET');
console.log('DB_NAME from env:', process.env.DB_NAME);
console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? '[HIDDEN]' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('================================');

// Legacy format for backwards compatibility with existing code
const legacyConfig = {
    HOST: process.env.DB_HOST || '35.213.224.151',
    USER: process.env.DB_USER || 'uhex928pteytg',
    PASSWORD: process.env.DB_PASSWORD || 'bei0w7c1yvnz',
    DB: process.env.DB_NAME || 'dbahuwojk8viis',
    dialect: 'postgres',
    pool: {
        max: 20,              // Increased from 5 - allows more concurrent connections
        min: 2,               // Increased from 0 - maintains minimum pool
        acquire: 60000,       // Increased from 30000 - 60 second timeout for acquiring connection
        idle: 10000,          // Keep existing - connection idle timeout
        evict: 10000,         // Add eviction timeout for stale connections
        handleDisconnects: true // Auto-reconnect on disconnect
    },
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
        } : false,
        connectTimeout: 60000  // 60 second connection timeout
    },
    logging: process.env.NODE_ENV === 'production' ? false : console.log
};

// Sequelize CLI format (for migrations)
const sequelizeCliConfig = {
    development: {
        username: process.env.DB_USER || 'uhex928pteytg',
        password: process.env.DB_PASSWORD || 'bei0w7c1yvnz',
        database: process.env.DB_NAME || 'dbahuwojk8viis',
        host: process.env.DB_HOST || '35.213.224.151',
        dialect: 'postgres',
        port: 5432
    },
    test: {
        username: process.env.DB_USER || 'uhex928pteytg',
        password: process.env.DB_PASSWORD || 'bei0w7c1yvnz',
        database: (process.env.DB_NAME || 'dbahuwojk8viis') + '_test',
        host: process.env.DB_HOST || '35.213.224.151',
        dialect: 'postgres',
        port: 5432
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        pool: {
            max: 20,
            min: 2,
            acquire: 60000,
            idle: 10000,
            evict: 10000,
            handleDisconnects: true
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            },
            connectTimeout: 60000
        }
    }
};

// Export both formats - legacy for backwards compatibility, CLI format for migrations
module.exports = Object.assign(legacyConfig, sequelizeCliConfig);
// module.exports = {
//     HOST: process.env.DB_HOST || '35.213.230.29',
//     USER: process.env.DB_USER || 'ujdtsiltjofcv',
//     PASSWORD: process.env.DB_PASSWORD || 'rofhasalxk5g',
//     DB: process.env.DB_NAME || 'dbudxdgwsnfcfc',
//     dialect: 'postgres',
//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000
//     }
// };

