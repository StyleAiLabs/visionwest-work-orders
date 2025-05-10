module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            // First check if columns exist to avoid errors
            const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'work_order_notes'
      `);

            const columnNames = columns.map(c => c.column_name);

            // If createdAt exists but created_at doesn't, rename it
            if (columnNames.includes('createdAt') && !columnNames.includes('created_at')) {
                await queryInterface.renameColumn('work_order_notes', 'createdAt', 'created_at');
            }

            // If updatedAt exists but updated_at doesn't, rename it
            if (columnNames.includes('updatedAt') && !columnNames.includes('updated_at')) {
                await queryInterface.renameColumn('work_order_notes', 'updatedAt', 'updated_at');
            }

            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    },
    down: async (queryInterface, Sequelize) => {
        try {
            await queryInterface.renameColumn('work_order_notes', 'created_at', 'createdAt');
            await queryInterface.renameColumn('work_order_notes', 'updated_at', 'updatedAt');
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    }
};