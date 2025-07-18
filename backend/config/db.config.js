// -- Staging --
console.log('=== DATABASE CONFIG DEBUG ===');
console.log('DB_HOST from env:', process.env.DB_HOST);
console.log('DB_USER from env:', process.env.DB_USER);
console.log('DB_PASSWORD from env:', process.env.DB_PASSWORD ? '[HIDDEN]' : 'NOT SET');
console.log('DB_NAME from env:', process.env.DB_NAME);
console.log('================================');

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

