module.exports = {
    HOST: process.env.DB_HOST || '35.213.224.151',
    USER: process.env.DB_USER || 'uhex928pteytg',
    PASSWORD: process.env.DB_PASSWORD || 'bei0w7c1yvnz',
    DB: process.env.DB_NAME || 'dbahuwojk8viis',
    dialect: 'postgres',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};