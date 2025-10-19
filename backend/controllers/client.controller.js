const db = require('../models');
const { Op } = require('sequelize');
const Client = db.client;
const User = db.user;
const WorkOrder = db.workOrder;

/**
 * Get active clients for dropdown (simplified, no pagination)
 * GET /api/clients/list
 * Staff and Admin endpoint for populating client filter dropdown
 */
exports.getClients = async (req, res) => {
    try {
        const userRole = req.userRole;

        // Verify staff or admin role
        if (!['staff', 'admin'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Staff or Admin access required',
                code: 'FORBIDDEN'
            });
        }

        // Fetch active clients sorted alphabetically by name
        const clients = await Client.findAll({
            where: { status: 'active' },
            attributes: ['id', 'name', 'code', 'status'],
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            clients
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch clients',
            message: error.message
        });
    }
};

/**
 * Get all clients with pagination, filtering, and search
 * GET /api/clients
 * Query params: status, page, limit, search
 */
exports.getAllClients = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        // Build where clause
        const where = {};

        if (status && ['active', 'inactive', 'archived'].includes(status)) {
            where.status = status;
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Query with counts
        const { count, rows } = await Client.findAndCountAll({
            where,
            limit: limitNum,
            offset,
            order: [['name', 'ASC']],
            attributes: {
                include: [
                    [
                        db.sequelize.literal(`(
                            SELECT COUNT(*)::int
                            FROM users
                            WHERE users.client_id = client.id
                        )`),
                        'user_count'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT COUNT(*)::int
                            FROM work_orders
                            WHERE work_orders.client_id = client.id
                        )`),
                        'work_order_count'
                    ]
                ]
            }
        });

        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count,
                pages: Math.ceil(count / limitNum)
            }
        });
    } catch (error) {
        console.error('Get all clients error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching clients',
            error: error.message
        });
    }
};

/**
 * Get client by ID with user and work order counts
 * GET /api/clients/:id
 */
exports.getClientById = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await Client.findByPk(id, {
            attributes: {
                include: [
                    [
                        db.sequelize.literal(`(
                            SELECT COUNT(*)::int
                            FROM users
                            WHERE users.client_id = client.id
                        )`),
                        'user_count'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT COUNT(*)::int
                            FROM work_orders
                            WHERE work_orders.client_id = client.id
                        )`),
                        'work_order_count'
                    ]
                ]
            }
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.status(200).json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Get client by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching client',
            error: error.message
        });
    }
};

/**
 * Create new client
 * POST /api/clients
 * Body: { name, code, primary_contact_name, primary_contact_email, primary_contact_phone, status }
 */
exports.createClient = async (req, res) => {
    try {
        const {
            name,
            code,
            primary_contact_name,
            primary_contact_email,
            primary_contact_phone,
            status = 'active'
        } = req.body;

        // Validate required fields
        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: [
                    { field: 'name', message: 'Name is required' },
                    { field: 'code', message: 'Code is required' }
                ].filter(err =>
                    (err.field === 'name' && !name) ||
                    (err.field === 'code' && !code)
                )
            });
        }

        // Validate status
        if (status && !['active', 'inactive', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: [
                    { field: 'status', message: 'Status must be active, inactive, or archived' }
                ]
            });
        }

        // Check if code already exists
        const existingClient = await Client.findOne({
            where: { code: code.toUpperCase() }
        });

        if (existingClient) {
            return res.status(409).json({
                success: false,
                message: 'Validation error',
                errors: [
                    { field: 'code', message: 'Code must be unique' }
                ]
            });
        }

        // Create client
        const client = await Client.create({
            name: name.trim(),
            code: code.toUpperCase(),
            primary_contact_name,
            primary_contact_email,
            primary_contact_phone,
            status
        });

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: client
        });
    } catch (error) {
        console.error('Create client error:', error);

        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while creating client',
            error: error.message
        });
    }
};

/**
 * Update client (code is immutable)
 * PUT /api/clients/:id
 * Body: { name, primary_contact_name, primary_contact_email, primary_contact_phone, status }
 */
exports.updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            code,
            primary_contact_name,
            primary_contact_email,
            primary_contact_phone,
            status
        } = req.body;

        // Check if client exists
        const client = await Client.findByPk(id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Prevent code modification
        if (code && code !== client.code) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: [
                    { field: 'code', message: 'Code cannot be modified' }
                ]
            });
        }

        // Validate status if provided
        if (status && !['active', 'inactive', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: [
                    { field: 'status', message: 'Status must be active, inactive, or archived' }
                ]
            });
        }

        // Build update object (only include provided fields)
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (primary_contact_name !== undefined) updates.primary_contact_name = primary_contact_name;
        if (primary_contact_email !== undefined) updates.primary_contact_email = primary_contact_email;
        if (primary_contact_phone !== undefined) updates.primary_contact_phone = primary_contact_phone;
        if (status !== undefined) updates.status = status;

        // Update client
        await client.update(updates);

        // Fetch updated client with counts
        const updatedClient = await Client.findByPk(id, {
            attributes: {
                include: [
                    [
                        db.sequelize.literal(`(
                            SELECT COUNT(*)::int
                            FROM users
                            WHERE users.client_id = client.id
                        )`),
                        'user_count'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT COUNT(*)::int
                            FROM work_orders
                            WHERE work_orders.client_id = client.id
                        )`),
                        'work_order_count'
                    ]
                ]
            }
        });

        res.status(200).json({
            success: true,
            message: 'Client updated successfully',
            data: updatedClient
        });
    } catch (error) {
        console.error('Update client error:', error);

        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while updating client',
            error: error.message
        });
    }
};

/**
 * Delete client (soft delete - set status to 'archived')
 * DELETE /api/clients/:id?confirm=true
 */
exports.deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirm } = req.query;

        // Require confirmation
        if (confirm !== 'true') {
            return res.status(400).json({
                success: false,
                message: 'Deletion requires confirmation. Add ?confirm=true to the request.'
            });
        }

        // Check if client exists
        const client = await Client.findByPk(id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Prevent deletion of Visionwest client
        if (client.code === 'VISIONWEST') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete the Visionwest client'
            });
        }

        // Check for active users or work orders
        const userCount = await User.count({ where: { client_id: id } });
        const workOrderCount = await WorkOrder.count({ where: { client_id: id } });

        if (userCount > 0 || workOrderCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete client with active users or work orders',
                details: {
                    user_count: userCount,
                    work_order_count: workOrderCount
                }
            });
        }

        // Soft delete - set status to archived
        await client.update({ status: 'archived' });

        res.status(200).json({
            success: true,
            message: 'Client archived successfully'
        });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting client',
            error: error.message
        });
    }
};

/**
 * Get client statistics
 * GET /api/clients/:id/stats
 */
exports.getClientStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if client exists
        const client = await Client.findByPk(id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Get user count
        const userCount = await User.count({ where: { client_id: id } });

        // Get work order count
        const workOrderCount = await WorkOrder.count({ where: { client_id: id } });

        // Get work orders by status
        const workOrdersByStatus = await WorkOrder.findAll({
            where: { client_id: id },
            attributes: [
                'status',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        const workOrdersStatusMap = workOrdersByStatus.reduce((acc, row) => {
            acc[row.status] = parseInt(row.count);
            return acc;
        }, {});

        // Get users by role
        const usersByRole = await User.findAll({
            where: { client_id: id },
            attributes: [
                'role',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
            ],
            group: ['role'],
            raw: true
        });

        const usersRoleMap = usersByRole.reduce((acc, row) => {
            acc[row.role] = parseInt(row.count);
            return acc;
        }, {});

        // Get oldest and newest work orders
        const oldestWorkOrder = await WorkOrder.findOne({
            where: { client_id: id },
            order: [['date', 'ASC']],
            attributes: ['date']
        });

        const newestWorkOrder = await WorkOrder.findOne({
            where: { client_id: id },
            order: [['date', 'DESC']],
            attributes: ['date']
        });

        res.status(200).json({
            success: true,
            data: {
                client_id: parseInt(id),
                user_count: userCount,
                work_order_count: workOrderCount,
                work_orders_by_status: workOrdersStatusMap,
                users_by_role: usersRoleMap,
                oldest_work_order: oldestWorkOrder?.date || null,
                newest_work_order: newestWorkOrder?.date || null
            }
        });
    } catch (error) {
        console.error('Get client stats error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching client statistics',
            error: error.message
        });
    }
};
