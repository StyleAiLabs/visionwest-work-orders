const express = require('express');
const router = express.Router();
const multer = require('multer');
const photoController = require('../controllers/photo.controller');
const { verifyToken, isAnyValidRole } = require('../middleware/auth.middleware');

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Apply auth middleware to all routes
router.use(verifyToken, isAnyValidRole);

// Get all photos for a work order
router.get('/work-order/:workOrderId', photoController.getWorkOrderPhotos);

// Upload photos for a work order
router.post('/work-order/:workOrderId', upload.array('photos', 20), photoController.uploadPhotos);

// Delete a photo
router.delete('/:id', photoController.deletePhoto);

module.exports = router;