const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth.middleware');
const clientScoping = require('../middleware/clientScoping');
const quoteAccess = require('../middleware/quoteAccess.middleware');
const quoteController = require('../controllers/quote.controller');
const quoteAttachmentController = require('../controllers/quoteAttachment.controller');

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images and common document types
        const allowedMimeTypes = [
            'image/',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ];

        const isAllowed = allowedMimeTypes.some(type => file.mimetype.startsWith(type));

        if (isAllowed) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed! Only images and documents (PDF, Word, Excel, Text) are supported.'), false);
        }
    }
});

// Apply auth middleware to all routes
router.use(authMiddleware.verifyToken);

// Apply client scoping to all routes (adds req.clientId from JWT)
router.use(clientScoping.addClientScope);

// ============================================================================
// Phase 4: US2.1 - Staff Views Pending Quotes
// ============================================================================

// Get quote summary for dashboard - all authenticated users
// T032: Dashboard summary counts by status
router.get('/summary', authMiddleware.isAnyValidRole, quoteController.getQuoteSummary);

// Get all quotes with filtering and pagination - all authenticated users
// T030, T033, T034: List quotes with role-based filtering, search, pagination
router.get('/', quoteAccess.applyQuoteFiltering, quoteController.getAllQuotes);

// Get quote by ID - with access control
// T031: Get quote details with associations
router.get('/:id', quoteAccess.verifyQuoteAccess, quoteController.getQuoteById);

// ============================================================================
// Phase 3: US1.1 - Client Admin Requests Quote (MVP)
// ============================================================================

// Create new quote - client_admin and admin only
// T014, T017, T018: Create quote with validation and client scoping
router.post('/', quoteAccess.canCreateQuote, quoteController.createQuote);

// Update draft quote - quote creator or admin
// T015: Update draft quote
router.patch('/:id', quoteAccess.verifyQuoteAccess, quoteController.updateQuote);

// Submit quote for review - change status from Draft → Submitted
// T016, T019: Submit quote and notify staff
router.post('/:id/submit', quoteAccess.verifyQuoteAccess, quoteController.submitQuote);

// ============================================================================
// Phase 6: US2.2 - Staff Provides Quote
// ============================================================================

// Staff provides quote with cost estimate and details
// T052-T056: Provide quote endpoint with validation
router.patch('/:id/provide-quote', authMiddleware.isStaffOrAdmin, quoteController.provideQuote);

// ============================================================================
// Phase 8: US3.2 - Client Admin Approves Quote
// ============================================================================

// Client admin approves quote
// T076-T081: Approve quote with validation
router.patch('/:id/approve', authMiddleware.isClientAdminOrAdmin, quoteController.approveQuote);

// ============================================================================
// Phase 9: US4.1 - Convert Approved Quote to Work Order
// ============================================================================

// Convert approved quote to work order
// T088-T097: Convert quote with transaction handling
router.post('/:id/convert', authMiddleware.isStaffOrAdmin, quoteController.convertToWorkOrder);

// ============================================================================
// Attachments - Upload and manage quote attachments
// ============================================================================

// Get all attachments for a quote
router.get('/:id/attachments', quoteAccess.verifyQuoteAccess, quoteAttachmentController.getQuoteAttachments);

// Upload attachments to a quote (max 5 files at once)
router.post('/:id/attachments', upload.array('attachments', 5), quoteAttachmentController.uploadAttachments);

// Delete a quote attachment
router.delete('/attachments/:id', quoteAttachmentController.deleteAttachment);

// ============================================================================
// Messaging - Add and retrieve quote messages/comments
// ============================================================================

// Get all messages for a quote
router.get('/:id/messages', quoteAccess.verifyQuoteAccess, quoteController.getMessages);

// Add a message/comment to a quote
router.post('/:id/messages', quoteAccess.verifyQuoteAccess, quoteController.addMessage);

// ============================================================================
// Phase 10: US2.3 - Staff Requests More Info
// ============================================================================

// Staff requests more information from client
// T105, T108: Request more info endpoint with staff/admin auth
router.patch('/:id/request-info', authMiddleware.isStaffOrAdmin, quoteController.requestInfo);

// ============================================================================
// Future Phases - Routes to be implemented
// ============================================================================

// Phase 4: US2.1 - Staff Views Pending Quotes
// GET    /api/quotes              - List quotes (role-based filtering)
// GET    /api/quotes/summary      - Dashboard summary
// GET    /api/quotes/:id          - Get quote details

// Phase 6: US2.2 - Staff Provides Quote
// PATCH  /api/quotes/:id/provide-quote    - Staff provides quote

// Phase 10: US2.3 - Staff Requests More Info
// PATCH  /api/quotes/:id/request-info     - Staff requests more info

// Phase 11: US2.4 - Staff Declines Quote
// PATCH  /api/quotes/:id/decline          - Staff declines quote

// Phase 8: US3.2 - Client Admin Approves Quote
// PATCH  /api/quotes/:id/approve          - Client admin approves quote

// Phase 12: US3.3 - Client Admin Declines Quote
// PATCH  /api/quotes/:id/decline-quote    - Client admin declines quote

// Phase 9: US4.1 - Convert to Work Order
// POST   /api/quotes/:id/convert          - Convert approved quote to work order

// Phase 10/16: Messaging
// POST   /api/quotes/:id/messages         - Add message to quote
// GET    /api/quotes/:id/messages         - Get quote messages

// Phase 6: Attachments
// POST   /api/quotes/:id/attachments      - Upload attachments
// GET    /api/quotes/:id/attachments      - Get quote attachments

module.exports = router;
