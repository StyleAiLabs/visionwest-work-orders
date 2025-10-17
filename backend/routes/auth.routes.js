const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;