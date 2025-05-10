const db = require('../models');
const Note = db.note;
const WorkOrder = db.workOrder;
const WorkOrderNote = db.workOrderNote;
const User = db.user;

exports.getAllNotes = async (req, res) => {
    try {
        const notes = await Note.findAll({
            include: [{
                model: db.user,
                as: 'creator',
                attributes: ['id', 'name', 'email']
            }]
        });

        return res.status(200).json({
            success: true,
            data: notes
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching notes',
            error: error.message
        });
    }
};

exports.getNoteById = async (req, res) => {
    try {
        const { id } = req.params;

        const note = await Note.findOne({
            where: { id },
            include: [{
                model: db.user,
                as: 'creator',
                attributes: ['id', 'name', 'email']
            }]
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: note
        });
    } catch (error) {
        console.error('Error fetching note:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the note',
            error: error.message
        });
    }
};

exports.addNote = async (req, res) => {
    try {
        const { workOrderId } = req.params;
        const { note } = req.body;
        const userId = req.userId;

        // Validate required fields
        if (!note || !note.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Note content is required.'
            });
        }

        // Create the note
        const newNote = await WorkOrderNote.create({
            note: note.trim(),
            work_order_id: workOrderId,
            created_by: userId
        });

        // Fetch the user who created the note
        const creator = await User.findByPk(userId, {
            attributes: ['id', 'name', 'role']
        });

        return res.status(201).json({
            success: true,
            message: 'Note added successfully!',
            data: {
                id: newNote.id,
                content: newNote.note,
                createdById: newNote.created_by,
                createdAt: newNote.createdAt,
                createdBy: creator ? {
                    id: creator.id,
                    name: creator.name,
                    role: creator.role
                } : null
            }
        });
    } catch (error) {
        console.error('Error adding note:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while adding the note.',
            error: error.message
        });
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        // Find the note
        const note = await Note.findOne({
            where: { id },
            include: [{
                model: WorkOrder,
                as: 'workOrder',
                attributes: ['id', 'status']
            }]
        });

        // Check if note exists
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Check if work order is completed
        if (note.workOrder && note.workOrder.status === 'completed') {
            return res.status(403).json({
                success: false,
                message: 'Cannot update notes for completed work orders'
            });
        }

        // Check if user has permission (only note creator or admin can update)
        if (note.created_by !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this note'
            });
        }

        // Update the note
        await note.update({ content });

        // Fetch updated note with user info
        const updatedNote = await Note.findOne({
            where: { id },
            include: [{
                model: db.user,
                as: 'creator',
                attributes: ['id', 'name', 'email']
            }]
        });

        return res.status(200).json({
            success: true,
            data: updatedNote,
            message: 'Note updated successfully'
        });

    } catch (error) {
        console.error('Error updating note:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating the note',
            error: error.message
        });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the note
        const note = await WorkOrderNote.findByPk(id);
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found.'
            });
        }

        // Delete the note
        await note.destroy();

        return res.status(200).json({
            success: true,
            message: 'Note deleted successfully!'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the note.',
            error: error.message
        });
    }
};

exports.getNotesByWorkOrderId = async (req, res) => {
    try {
        const { workOrderId } = req.params;

        // Validate work order ID
        if (!workOrderId || isNaN(parseInt(workOrderId))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid work order ID'
            });
        }

        // Find all notes for the work order
        const notes = await WorkOrderNote.findAll({
            where: { work_order_id: workOrderId },
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'name', 'role']
            }]
        });

        // Format the notes for the response
        const formattedNotes = notes.map(note => ({
            id: note.id,
            content: note.note || '',
            createdById: note.created_by,
            createdAt: note.createdAt,
            createdBy: note.creator ? {
                id: note.creator.id,
                name: note.creator.name,
                role: note.creator.role
            } : null
        }));

        return res.status(200).json({
            success: true,
            data: formattedNotes
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching notes.',
            error: error.message
        });
    }
};