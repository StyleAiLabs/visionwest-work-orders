const db = require('../models');
const Photo = db.photo;
const WorkOrder = db.workOrder;
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// Get all photos for a work order
exports.getWorkOrderPhotos = async (req, res) => {
    try {
        const { workOrderId } = req.params;

        // Verify work order exists
        const workOrder = await WorkOrder.findByPk(workOrderId);
        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found.'
            });
        }

        // Get photos
        const photos = await Photo.findAll({
            where: { work_order_id: workOrderId },
            order: [['createdAt', 'DESC']]
        });

        // Format response
        const formattedPhotos = photos.map(photo => ({
            id: photo.id,
            url: photo.file_path,
            filename: photo.file_name,
            description: photo.description,
            uploadedAt: photo.createdAt
        }));

        return res.status(200).json({
            success: true,
            data: formattedPhotos
        });
    } catch (error) {
        console.error('Error fetching work order photos:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching work order photos.'
        });
    }
};

// Upload photos for a work order
exports.uploadPhotos = async (req, res) => {
    try {
        const { workOrderId } = req.params;
        const { description } = req.body;

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files were uploaded.'
            });
        }

        // Verify work order exists
        const workOrder = await WorkOrder.findByPk(workOrderId);
        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found.'
            });
        }

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../uploads');
        const workOrderDir = path.join(uploadDir, `work-order-${workOrderId}`);

        try {
            await mkdirAsync(uploadDir, { recursive: true });
            await mkdirAsync(workOrderDir, { recursive: true });
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }

        // Process and save each uploaded file
        const uploadedPhotos = [];

        for (const file of req.files) {
            const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
            const filePath = path.join(workOrderDir, filename);

            // Save file to disk
            await writeFileAsync(filePath, file.buffer);

            // Save file info to database
            const photo = await Photo.create({
                work_order_id: workOrderId,
                file_path: `/uploads/work-order-${workOrderId}/${filename}`,
                file_name: filename,
                description: description || null,
                uploaded_by: req.userId // From auth middleware
            });

            uploadedPhotos.push({
                id: photo.id,
                url: photo.file_path,
                filename: photo.file_name,
                description: photo.description,
                uploadedAt: photo.createdAt
            });
        }

        return res.status(201).json({
            success: true,
            message: `${uploadedPhotos.length} photo(s) uploaded successfully!`,
            data: uploadedPhotos
        });
    } catch (error) {
        console.error('Error uploading photos:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while uploading photos.'
        });
    }
};

// Delete a photo
exports.deletePhoto = async (req, res) => {
    try {
        const { id } = req.params;

        // Find photo
        const photo = await Photo.findByPk(id);
        if (!photo) {
            return res.status(404).json({
                success: false,
                message: 'Photo not found.'
            });
        }

        // Get absolute file path
        const filePath = path.join(__dirname, '..', photo.file_path.replace(/^\/uploads/, 'uploads'));

        // Delete file from filesystem
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error('Error deleting file from filesystem:', err);
            // Continue even if file doesn't exist on disk
        }

        // Delete record from database
        await photo.destroy();

        return res.status(200).json({
            success: true,
            message: 'Photo deleted successfully!'
        });
    } catch (error) {
        console.error('Error deleting photo:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the photo.'
        });
    }
};