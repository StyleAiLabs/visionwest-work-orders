module.exports = (sequelize, Sequelize) => {
    const Quote = sequelize.define('quote', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        quote_number: {
            type: Sequelize.STRING(20),
            allowNull: false,
            unique: true
        },
        client_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM(
                'Draft',
                'Submitted',
                'Information Requested',
                'Quoted',
                'Under Discussion',
                'Approved',
                'Declined',
                'Expired',
                'Converted'
            ),
            allowNull: false,
            defaultValue: 'Draft'
        },
        property_name: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        property_address: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        property_phone: {
            type: Sequelize.STRING(50),
            allowNull: true
        },
        title: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        work_type: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Type of work requested (Full property clean up, Rubbish removal, etc.)'
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        scope_of_work: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        contact_person: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        contact_email: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        contact_phone: {
            type: Sequelize.STRING(50),
            allowNull: true
        },
        is_urgent: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        required_by_date: {
            type: Sequelize.DATE,
            allowNull: true
        },
        estimated_cost: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true
        },
        estimated_hours: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: true
        },
        quote_notes: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        itemized_breakdown: {
            type: Sequelize.JSONB,
            allowNull: true,
            comment: 'Itemized cost breakdown (materials, labor, subcontractor costs)'
        },
        quote_valid_until: {
            type: Sequelize.DATE,
            allowNull: true
        },
        quoted_at: {
            type: Sequelize.DATE,
            allowNull: true
        },
        approved_at: {
            type: Sequelize.DATE,
            allowNull: true
        },
        declined_at: {
            type: Sequelize.DATE,
            allowNull: true
        },
        converted_at: {
            type: Sequelize.DATE,
            allowNull: true
        },
        converted_to_work_order_id: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        created_by: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        submitted_at: {
            type: Sequelize.DATE,
            allowNull: true
        },
        created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
    }, {
        tableName: 'quotes',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Quote;
};
