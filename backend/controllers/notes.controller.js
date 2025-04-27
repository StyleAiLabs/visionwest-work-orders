const db = require('../models');
const Note = db.note;
const WorkOrder = db.workOrder;

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
        const { content } = req.body;

        console.log('Adding note - workOrderId:', workOrderId);
        console.log('Adding note - content:', content);
        console.log('Adding note - userId:', req.userId);

        // Validate input
        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Note content is required'
            });
        }

        // Check if work order exists
        const workOrder = await WorkOrder.findByPk(workOrderId);
        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found'
            });
        }

        // Create note
        const note = await Note.create({
            content,
            work_order_id: workOrderId,
            created_by: req.userId
        });

        // Fetch the created note with user information
        const createdNote = await Note.findOne({
            where: { id: note.id },
            include: [{
                model: db.user,
                as: 'creator',
                attributes: ['id', 'name', 'email']
            }]
        });

        return res.status(201).json({
            success: true,
            data: {
                id: createdNote.id,
                content: createdNote.content,
                createdAt: createdNote.createdAt,
                creator: createdNote.creator
            }
        });

    } catch (error) {
        console.error('Error in addNote:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while adding the note',
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
        if (note.workOrder.status === 'completed') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete notes from completed work orders'
            });
        }

        // Check if user has permission (only note creator or admin can delete)
        if (note.created_by !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this note'
            });
        }

        // Delete the note
        await note.destroy();

        return res.status(200).json({
            success: true,
            message: 'Note deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting note:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the note',
            error: error.message
        });
    }
};