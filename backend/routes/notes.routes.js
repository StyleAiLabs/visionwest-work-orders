const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const noteController = require('../controllers/notes.controller');

router.get('/', verifyToken, noteController.getAllNotes);
router.get('/:id', verifyToken, noteController.getNoteById);
router.post('/', verifyToken, noteController.createNote);
router.put('/:id', verifyToken, noteController.updateNote);
router.delete('/:id', verifyToken, noteController.deleteNote);

// Add this route for better organization
router.post('/work-orders/:workOrderId/notes', verifyToken, noteController.addNote);

module.exports = router;