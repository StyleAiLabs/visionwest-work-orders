const db = require('../models');
const QuoteAttachment = db.quoteAttachment;
const Quote = db.quote;
const User = db.user;
const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// Get all attachments for a quote
exports.getQuoteAttachments = async (req, res) => {
    try {
        const { id: quoteId } = req.params;

        console.log('Fetching attachments for quote:', quoteId);

        // Verify quote exists
        const quote = await Quote.findByPk(quoteId);
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found.'
            });
        }

        // Get attachments with uploader information
        const attachments = await QuoteAttachment.findAll({
            where: { quote_id: quoteId },
            include: [{
                model: User,
                as: 'uploader',
                attributes: ['id', 'full_name', 'email']
            }],
            order: [['uploaded_at', 'DESC']]
        });

        console.log('Found attachments:', attachments.length);

        // Format attachment information
        const formattedAttachments = attachments.map(attachment => ({
            id: attachment.id,
            url: attachment.file_url,
            filename: attachment.file_name,
            fileType: attachment.file_type,
            fileSize: attachment.file_size,
            mimeType: attachment.mime_type,
            description: attachment.description,
            uploadedAt: attachment.uploaded_at,
            uploadedBy: attachment.uploader ? {
                id: attachment.uploader.id,
                name: attachment.uploader.full_name,
                email: attachment.uploader.email
            } : null
        }));

        return res.status(200).json({
            success: true,
            count: formattedAttachments.length,
            data: formattedAttachments
        });

    } catch (error) {
        console.error('Error fetching quote attachments:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching quote attachments.',
            error: error.message
        });
    }
};

// Upload attachments to AWS S3 for a quote
exports.uploadAttachments = async (req, res) => {
    try {
        const { id: quoteId } = req.params;
        const { description } = req.body;

        console.log('=== UPLOAD QUOTE ATTACHMENTS ===');
        console.log('Quote ID:', quoteId);
        console.log('User ID:', req.userId);
        console.log('Files:', req.files?.length);

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files were uploaded.'
            });
        }

        // Verify quote exists
        const quote = await Quote.findByPk(quoteId);
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found.'
            });
        }

        // Verify user has access to this quote
        // Client admins can only upload to their own quotes, staff/admin can upload to any
        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin';
        const isQuoteCreator = quote.created_by === req.userId;
        const isSameClient = quote.client_id === user.client_id;

        if (!isStaffOrAdmin && !isQuoteCreator && !isSameClient) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to upload attachments to this quote.'
            });
        }

        // Get the quote number for organizing files
        const quoteNumber = quote.quote_number;

        // Process and upload each file to S3
        const uploadedAttachments = [];

        for (const file of req.files) {
            // Determine file type based on MIME type
            let fileType = 'other';
            if (file.mimetype.startsWith('image/')) {
                fileType = 'photo';
            } else if (
                file.mimetype === 'application/pdf' ||
                file.mimetype.startsWith('application/') ||
                file.mimetype.startsWith('text/')
            ) {
                fileType = 'document';
            }

            // Create a unique filename
            const timestamp = Date.now();
            const safeFilename = file.originalname.replace(/\s+/g, '-').toLowerCase();
            const s3Key = `quotes/${quoteNumber}/${timestamp}-${safeFilename}`;

            console.log('Uploading file:', safeFilename, 'Type:', fileType);

            // Set up the S3 upload parameters
            const params = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: s3Key,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            // Upload to S3
            const uploadResult = await s3.upload(params).promise();
            console.log('✓ Uploaded to S3:', uploadResult.Location);

            // Save file info to database
            const attachment = await QuoteAttachment.create({
                quote_id: quoteId,
                user_id: req.userId,
                file_type: fileType,
                file_name: safeFilename,
                file_url: uploadResult.Location,
                file_size: file.size,
                mime_type: file.mimetype,
                description: description || null,
                uploaded_at: new Date()
            });

            console.log('✓ Saved to database:', attachment.id);

            uploadedAttachments.push({
                id: attachment.id,
                url: attachment.file_url,
                filename: attachment.file_name,
                fileType: attachment.file_type,
                fileSize: attachment.file_size,
                mimeType: attachment.mime_type,
                description: attachment.description,
                uploadedAt: attachment.uploaded_at,
                uploadedBy: {
                    id: user.id,
                    name: user.full_name,
                    email: user.email
                }
            });
        }

        return res.status(201).json({
            success: true,
            message: `${uploadedAttachments.length} file(s) uploaded successfully!`,
            data: uploadedAttachments
        });

    } catch (error) {
        console.error('Error uploading quote attachments:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while uploading attachments.',
            error: error.message
        });
    }
};

// Delete a quote attachment
exports.deleteAttachment = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('=== DELETE QUOTE ATTACHMENT ===');
        console.log('Attachment ID:', id);
        console.log('User ID:', req.userId);

        // Find the attachment
        const attachment = await QuoteAttachment.findByPk(id, {
            include: [{
                model: Quote,
                as: 'quote',
                attributes: ['id', 'quote_number', 'created_by', 'client_id']
            }]
        });

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: 'Attachment not found.'
            });
        }

        // Verify user has permission to delete
        const user = await User.findByPk(req.userId);
        const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin';
        const isUploader = attachment.user_id === req.userId;
        const isQuoteCreator = attachment.quote.created_by === req.userId;
        const isSameClient = attachment.quote.client_id === user.client_id;

        if (!isStaffOrAdmin && !isUploader && !isQuoteCreator && !isSameClient) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this attachment.'
            });
        }

        // Extract S3 key from URL
        const s3Url = attachment.file_url;
        let s3Key;

        try {
            const url = new URL(s3Url);
            // For S3 URLs, the key is the pathname without the leading slash
            s3Key = url.pathname.substring(1);
        } catch (error) {
            console.error('Error parsing S3 URL:', error);
            // If URL parsing fails, try to extract from AWS S3 URL format
            const match = s3Url.match(/\.com\/(.+)$/);
            if (match) {
                s3Key = match[1];
            } else {
                throw new Error('Could not extract S3 key from URL');
            }
        }

        console.log('Deleting from S3:', s3Key);

        // Delete from S3
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key
        };

        await s3.deleteObject(deleteParams).promise();
        console.log('✓ Deleted from S3');

        // Delete from database
        await attachment.destroy();
        console.log('✓ Deleted from database');

        return res.status(200).json({
            success: true,
            message: 'Attachment deleted successfully.'
        });

    } catch (error) {
        console.error('Error deleting quote attachment:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the attachment.',
            error: error.message
        });
    }
};
