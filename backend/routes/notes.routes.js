const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const noteController = require('../controllers/notes.controller');

// Only include routes that have controller methods implemented
router.post('/', verifyToken, noteController.addNote);
router.delete('/:id', verifyToken, noteController.deleteNote);

// Add the work order notes endpoint
router.post('/work-orders/:workOrderId/notes', verifyToken, noteController.addNote);

module.exports = router;