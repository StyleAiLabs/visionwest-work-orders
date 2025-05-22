const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware.verifyToken);

// GET notes for a specific work order
router.get('/work-orders/:workOrderId/notes', authMiddleware.canViewWorkOrderNotes, notesController.getNotesByWorkOrderId);

// Add a note to a work order
router.post('/work-orders/:workOrderId/notes', authMiddleware.canViewWorkOrderNotes, notesController.addNote);

// Delete a specific note
router.delete('/notes/:id', authMiddleware.isStaffOrAdmin, notesController.deleteNote);

module.exports = router;