const express = require('express');
const router = express.Router();
const { verifyToken, isClientAdminOrAdmin } = require('../middleware/auth.middleware');
const { addClientScope } = require('../middleware/clientScoping');
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');

// All routes require authentication and client_admin or admin role
router.use(verifyToken);
router.use(isClientAdminOrAdmin);
router.use(addClientScope);

// User management endpoints
router.get('/', listUsers);            // GET /api/users
router.post('/', createUser);          // POST /api/users
router.get('/:userId', getUserById);   // GET /api/users/:userId
router.patch('/:userId', updateUser);  // PATCH /api/users/:userId
router.delete('/:userId', deleteUser); // DELETE /api/users/:userId

module.exports = router;
