const db = require('../models');
const Photo = db.photo;
const WorkOrder = db.workOrder;
const User = db.user;  // Add this line to import User model
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const AWS = require('aws-sdk');
const multer = require('multer');
const unlinkAsync = promisify(fs.unlink);
const notificationController = require('./notification.controller');

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// Get all photos for a work order
exports.getWorkOrderPhotos = async (req, res) => {
    try {
        const { workOrderId } = req.params;

        // Add logging for debugging
        console.log('Fetching photos for work order:', workOrderId);

        // Verify work order exists
        const workOrder = await WorkOrder.findByPk(workOrderId);
        if (!workOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found.'
            });
        }

        // Get photos without user information first to check if query works
        const photos = await Photo.findAll({
            where: { work_order_id: workOrderId },
            order: [['createdAt', 'DESC']]
        });

        console.log('Found photos:', photos.length);

        // If no photos found, return empty array
        if (!photos || photos.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }

        // Format basic photo information
        const formattedPhotos = photos.map(photo => ({
            id: photo.id,
            url: photo.file_path,
            filename: photo.file_name,
            description: photo.description,
            uploadedAt: photo.createdAt,
            uploadedBy: null // We'll add user info in a separate query
        }));

        // Get user information separately
        for (let photo of formattedPhotos) {
            const photoRecord = photos.find(p => p.id === photo.id);
            if (photoRecord.uploaded_by) {
                const user = await User.findByPk(photoRecord.uploaded_by);
                if (user) {
                    photo.uploadedBy = {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    };
                }
            }
        }

        return res.status(200).json({
            success: true,
            count: formattedPhotos.length,
            data: formattedPhotos
        });

    } catch (error) {
        console.error('Error details:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching work order photos.',
            error: error.message
        });
    }
};

// Upload photos to AWS S3 for a work order
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

        // Get the job number for organizing files
        const jobNo = workOrder.job_no;

        // Process and upload each file to S3
        const uploadedPhotos = [];

        // Get user information
        const user = await User.findByPk(req.userId);

        for (const file of req.files) {
            // Create a unique filename
            const timestamp = Date.now();
            const safeFilename = file.originalname.replace(/\s+/g, '-').toLowerCase();
            const s3Key = `work-orders/${jobNo}/${timestamp}-${safeFilename}`;

            // Set up the S3 upload parameters
            const params = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: s3Key,
                Body: file.buffer,
                ContentType: file.mimetype,
                // ACL: 'public-read' // Make the file publicly accessible
            };

            // Upload to S3
            const uploadResult = await s3.upload(params).promise();

            // Save file info to database
            const photo = await Photo.create({
                work_order_id: workOrderId,
                file_path: uploadResult.Location, // S3 URL
                file_name: safeFilename,
                description: description || null,
                uploaded_by: req.userId // From auth middleware
            });

            uploadedPhotos.push({
                id: photo.id,
                url: photo.file_path,
                filename: photo.file_name,
                description: photo.description,
                uploadedAt: photo.createdAt,
                uploadedBy: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });
        }

        // After successful upload, send response first
        const response = {
            success: true,
            message: `${uploadedPhotos.length} photo(s) uploaded successfully!`,
            data: uploadedPhotos
        };

        res.status(201).json(response);

        // Then create notification asynchronously (non-blocking)
        try {
            await notificationController.notifyPhotoUpdate(
                workOrderId,
                'add',
                req.userId,
                uploadedPhotos.length
            );
        } catch (notificationError) {
            // Log error but don't affect the already sent response
            console.error('Error creating notification:', notificationError);
        }

    } catch (error) {
        console.error('Error uploading photos to S3:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while uploading photos to S3.',
            error: error.message
        });
    }
};

// Delete a photo
exports.deletePhoto = async (req, res) => {
    try {
        const { id } = req.params;

        // Find photo and work order information before deletion
        const photo = await Photo.findByPk(id, {
            include: [{
                model: WorkOrder,
                attributes: ['id', 'job_no']
            }]
        });

        if (!photo) {
            return res.status(404).json({
                success: false,
                message: 'Photo not found.'
            });
        }

        const workOrderId = photo.work_order_id;

        // Extract the S3 key from the URL
        const url = new URL(photo.file_path);
        const key = url.pathname.substring(1); // Remove leading slash

        // Delete from S3
        try {
            await s3.deleteObject({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key
            }).promise();
        } catch (s3Error) {
            console.error('Error deleting from S3:', s3Error);
            // Continue even if S3 deletion fails
        }

        // Delete record from database
        await photo.destroy();

        // Create notification after successful deletion
        await notificationController.notifyPhotoUpdate(
            workOrderId,
            'delete',
            req.userId,
            1 // Single photo deleted
        );

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