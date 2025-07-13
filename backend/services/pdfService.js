const PDFDocument = require('pdfkit');
const axios = require('axios');
const sharp = require('sharp');
const db = require('../models');

class PDFService {    static async downloadAndResizeImage(imageUrl, maxWidth = 150, maxHeight = 150) {
        try {
            console.log('Downloading image:', imageUrl);
            
            // Validate URL
            if (!imageUrl || typeof imageUrl !== 'string') {
                console.log('Invalid image URL provided');
                return null;
            }

            // Check if URL is accessible
            if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                console.log('Image URL does not start with http/https:', imageUrl);
                return null;
            }
            
            // Download image with better error handling
            const response = await axios({
                method: 'GET',
                url: imageUrl,
                responseType: 'arraybuffer',
                timeout: 15000, // 15 second timeout
                headers: {
                    'User-Agent': 'VisionWest-PDF-Generator/1.0',
                    'Accept': 'image/*'
                },
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 200 && status < 300;
                }
            });

            console.log(`Image downloaded successfully. Size: ${response.data.length} bytes, Content-Type: ${response.headers['content-type']}`);

            // Check if we got valid image data
            if (!response.data || response.data.length === 0) {
                console.log('No image data received');
                return null;
            }

            // Resize image to thumbnail
            const resizedImage = await sharp(response.data)
                .resize(maxWidth, maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            console.log(`Image resized successfully. Final size: ${resizedImage.length} bytes`);
            return resizedImage;
        } catch (error) {
            console.error('Error processing image:', {
                url: imageUrl,
                error: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            return null;
        }
    }

    static async generateWorkOrderPDF(workOrderId) {
        try {
            console.log(`Generating PDF for work order ID: ${workOrderId}`);

            // Fetch all work order data with related tables
            const workOrder = await db.workOrder.findByPk(workOrderId, {
                include: [
                    {
                        model: db.photo,
                        as: 'photos',
                        required: false
                    },
                    {
                        model: db.workOrderNote,
                        as: 'notes',
                        required: false
                    },
                    {
                        model: db.statusUpdate,
                        as: 'statusUpdates',
                        required: false
                    }
                ]
            });

            if (!workOrder) {
                throw new Error(`Work order with ID ${workOrderId} not found`);
            }

            console.log(`Found work order: ${workOrder.job_no}`);

            // Create PDF document
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4'
            });

            // Create a buffer to store the PDF
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));            // Return a promise that resolves when the PDF is complete
            return new Promise(async (resolve, reject) => {
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    console.log('PDF generated successfully');
                    resolve(pdfBuffer);
                });

                doc.on('error', reject);

                try {
                    await this.generatePDFContent(doc, workOrder);
                    doc.end();
                } catch (error) {
                    reject(error);
                }
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    static async generatePDFContent(doc, workOrder) {
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const addSection = (title, yPosition) => {
            doc.fontSize(16)
                .fillColor('#1e40af')
                .text(title, 50, yPosition)
                .moveTo(50, yPosition + 25)
                .lineTo(550, yPosition + 25)
                .strokeColor('#e5e7eb')
                .lineWidth(2)
                .stroke();
            return yPosition + 40;
        };

        const addInfoItem = (label, value, x, y, width = 200) => {
            doc.fontSize(10)
                .fillColor('#374151')
                .text(label, x, y)
                .fontSize(12)
                .fillColor('#1f2937')
                .text(value || 'Not specified', x, y + 15, { width: width });
            return y + 45;
        };

        let currentY = 50;

        // Header with blue background
        doc.rect(0, 0, doc.page.width, 120)
            .fillColor('#1e40af')
            .fill();

        doc.fillColor('white')
            .fontSize(24)
            .text(`Work Order #${workOrder.job_no}`, 50, 30);

        doc.fontSize(12)
            .text(`Generated on ${formatDate(new Date())}`, 50, 65);

        currentY = 140;

        // Work Order Details Section
        currentY = addSection('Work Order Details', currentY);

        let nextY = addInfoItem('Status', workOrder.status, 50, currentY);
        addInfoItem('Work Order Type', workOrder.work_order_type, 300, currentY);
        currentY = Math.max(nextY, currentY + 45);

        nextY = addInfoItem('Created Date', formatDate(workOrder.createdAt), 50, currentY);
        addInfoItem('Last Updated', formatDate(workOrder.updatedAt), 300, currentY);
        currentY = Math.max(nextY, currentY + 45);

        nextY = addInfoItem('PO Number', workOrder.po_number, 50, currentY);
        addInfoItem('Date', formatDate(workOrder.date), 300, currentY);
        currentY = Math.max(nextY, currentY + 45);

        // Property Information Section
        currentY += 20;
        if (currentY > 700) { // Start new page if needed
            doc.addPage();
            currentY = 50;
        }
        currentY = addSection('Property Information', currentY);

        nextY = addInfoItem('Property Name', workOrder.property_name, 50, currentY);
        currentY = nextY;

        nextY = addInfoItem('Property Address', workOrder.property_address, 50, currentY, 400);
        currentY = nextY;

        nextY = addInfoItem('Property Phone', workOrder.property_phone, 50, currentY);
        currentY = nextY;

        // Supplier Information Section
        currentY += 20;
        if (currentY > 650) { // Start new page if needed
            doc.addPage();
            currentY = 50;
        }
        currentY = addSection('Supplier Information', currentY);

        nextY = addInfoItem('Supplier Name', workOrder.supplier_name, 50, currentY);
        addInfoItem('Supplier Phone', workOrder.supplier_phone, 300, currentY);
        currentY = Math.max(nextY, currentY + 45);

        nextY = addInfoItem('Supplier Email', workOrder.supplier_email, 50, currentY, 400);
        currentY = nextY;

        // Authorization Section
        currentY += 20;
        if (currentY > 650) { // Start new page if needed
            doc.addPage();
            currentY = 50;
        }
        currentY = addSection('Authorization', currentY);

        nextY = addInfoItem('Authorized By', workOrder.authorized_by, 50, currentY);
        addInfoItem('Authorized Contact', workOrder.authorized_contact, 300, currentY);
        currentY = Math.max(nextY, currentY + 45);

        nextY = addInfoItem('Authorized Email', workOrder.authorized_email, 50, currentY, 400);
        currentY = nextY;

        // Work Description Section
        currentY += 20;
        if (currentY > 650) { // Start new page if needed
            doc.addPage();
            currentY = 50;
        }
        currentY = addSection('Work Description', currentY);

        // Add background box for description
        doc.rect(50, currentY, 500, 60)
            .fillColor('#f9fafb')
            .fill();

        doc.fontSize(12)
            .fillColor('#1f2937')
            .text(workOrder.description || 'No description provided.', 60, currentY + 10, {
                width: 480,
                align: 'left'
            });

        // Calculate height needed for description
        const descriptionHeight = doc.heightOfString(workOrder.description || 'No description provided.', { width: 480 });
        currentY += Math.max(60, descriptionHeight + 20);        // Photos Section
        if (workOrder.photos && workOrder.photos.length > 0) {
            currentY += 20;
            if (currentY > 650) { // Start new page if needed
                doc.addPage();
                currentY = 50;
            }
            currentY = addSection(`Photos (${workOrder.photos.length})`, currentY);

            for (let i = 0; i < workOrder.photos.length; i++) {
                const photo = workOrder.photos[i];

                // Calculate required height (thumbnail + text)
                const requiredHeight = 180; // 150px for thumbnail + 30px for text

                if (currentY + requiredHeight > 700) { // Start new page if needed
                    doc.addPage();
                    currentY = 50;
                }

                // Photo container box
                doc.rect(50, currentY, 500, requiredHeight)
                    .fillColor('#f9fafb')
                    .fill();

                try {
                    // Try to download and embed the actual image
                    let imageBuffer = null;
                    const imageUrl = photo.url || photo.file_path || photo.image_url || photo.imageUrl;
                    
                    console.log(`Processing photo ${i + 1}:`, {
                        id: photo.id,
                        url: photo.url,
                        file_path: photo.file_path,
                        description: photo.description,
                        imageUrl: imageUrl
                    });
                    
                    if (imageUrl) {
                        console.log(`Attempting to download image: ${imageUrl}`);
                        imageBuffer = await this.downloadAndResizeImage(imageUrl, 120, 120);
                    } else {
                        console.log(`No image URL found for photo ${i + 1}`);
                    }

                    if (imageBuffer) {
                        // Embed actual image thumbnail
                        doc.image(imageBuffer, 70, currentY + 20, {
                            width: 120,
                            height: 120,
                            fit: [120, 120],
                            align: 'center',
                            valign: 'center'
                        });

                        // Image info text beside the thumbnail
                        doc.fontSize(11)
                            .fillColor('#374151')
                            .text(`📷 Photo ${i + 1}`, 210, currentY + 20);

                        doc.fontSize(10)
                            .fillColor('#6b7280')
                            .text(photo.description || 'No description', 210, currentY + 40, { width: 280 });

                        doc.fontSize(9)
                            .fillColor('#9ca3af')
                            .text(formatDate(photo.createdAt), 210, currentY + 80);

                        // Image dimensions/file info if available
                        if (photo.file_size || photo.fileSize) {
                            const fileSize = photo.file_size || photo.fileSize;
                            doc.fontSize(8)
                                .fillColor('#9ca3af')
                                .text(`File size: ${Math.round(fileSize / 1024)} KB`, 210, currentY + 100);
                        }

                    } else {
                        // Fallback to placeholder box if image couldn't be loaded
                        doc.rect(70, currentY + 20, 120, 120)
                            .fillColor('#e5e7eb')
                            .fill();

                        // Placeholder icon and text
                        doc.fontSize(24)
                            .fillColor('#9ca3af')
                            .text('📷', 125, currentY + 65, { align: 'center' });

                        doc.fontSize(8)
                            .fillColor('#6b7280')
                            .text('Image not\navailable', 95, currentY + 95, { align: 'center', width: 70 });

                        // Photo info text beside the placeholder
                        doc.fontSize(11)
                            .fillColor('#374151')
                            .text(`📷 Photo ${i + 1}`, 210, currentY + 20);

                        doc.fontSize(10)
                            .fillColor('#6b7280')
                            .text(photo.description || 'No description', 210, currentY + 40, { width: 280 });

                        doc.fontSize(9)
                            .fillColor('#9ca3af')
                            .text(formatDate(photo.createdAt), 210, currentY + 80);                        // Show image URL if available
                        if (imageUrl) {
                            doc.fontSize(8)
                               .fillColor('#9ca3af')
                               .text(`URL: ${imageUrl.substring(0, 60)}${imageUrl.length > 60 ? '...' : ''}`, 210, currentY + 100, { width: 280 });
                        } else {
                            doc.fontSize(8)
                               .fillColor('#9ca3af')
                               .text('No image URL found', 210, currentY + 100, { width: 280 });
                        }
                    }
                } catch (error) {
                    console.error(`Error processing photo ${i + 1}:`, error);

                    // Error fallback - show placeholder
                    doc.rect(70, currentY + 20, 120, 120)
                        .fillColor('#fef2f2')
                        .fill();

                    doc.fontSize(24)
                        .fillColor('#ef4444')
                        .text('⚠️', 125, currentY + 65, { align: 'center' });

                    doc.fontSize(8)
                        .fillColor('#dc2626')
                        .text('Error loading\nimage', 95, currentY + 95, { align: 'center', width: 70 });

                    // Photo info text
                    doc.fontSize(11)
                        .fillColor('#374151')
                        .text(`📷 Photo ${i + 1} (Error)`, 210, currentY + 20);

                    doc.fontSize(10)
                        .fillColor('#6b7280')
                        .text(photo.description || 'No description', 210, currentY + 40, { width: 280 });

                    doc.fontSize(9)
                        .fillColor('#9ca3af')
                        .text(formatDate(photo.createdAt), 210, currentY + 80);
                }

                currentY += requiredHeight + 10;
            }
        }

        // Notes Section
        if (workOrder.notes && workOrder.notes.length > 0) {
            currentY += 20;
            if (currentY > 650) { // Start new page if needed
                doc.addPage();
                currentY = 50;
            }

            currentY = addSection(`Notes & Comments (${workOrder.notes.length})`, currentY);

            workOrder.notes.forEach((note, index) => {
                const noteHeight = Math.max(60, doc.heightOfString(note.content, { width: 480 }) + 40);

                if (currentY + noteHeight > 700) { // Start new page if needed
                    doc.addPage();
                    currentY = 50;
                }

                // Note box
                doc.rect(50, currentY, 500, noteHeight)
                    .fillColor('#f9fafb')
                    .fill();

                doc.fontSize(11)
                    .fillColor('#374151')
                    .text(`Note ${index + 1} • ${formatDate(note.createdAt)}`, 60, currentY + 10);

                doc.fontSize(10)
                    .fillColor('#1f2937')
                    .text(note.content, 60, currentY + 30, { width: 480 });

                currentY += noteHeight + 10;
            });
        }

        // Status Updates Section
        if (workOrder.statusUpdates && workOrder.statusUpdates.length > 0) {
            currentY += 20;
            if (currentY > 650) { // Start new page if needed
                doc.addPage();
                currentY = 50;
            }

            currentY = addSection(`Status History (${workOrder.statusUpdates.length})`, currentY);

            workOrder.statusUpdates.forEach((update, index) => {
                const updateText = update.notes || '';
                const updateHeight = Math.max(50, doc.heightOfString(updateText, { width: 480 }) + 40);

                if (currentY + updateHeight > 700) { // Start new page if needed
                    doc.addPage();
                    currentY = 50;
                }

                // Status box
                doc.rect(50, currentY, 500, updateHeight)
                    .fillColor('#f9fafb')
                    .fill();

                doc.fontSize(11)
                    .fillColor('#374151')
                    .text(`Status changed to "${update.new_status}" • ${formatDate(update.createdAt)}`, 60, currentY + 10);

                if (update.notes) {
                    doc.fontSize(10)
                        .fillColor('#1f2937')
                        .text(update.notes, 60, currentY + 30, { width: 480 });
                }

                currentY += updateHeight + 10;
            });
        }

        // Footer
        if (currentY > 650) { // Start new page for footer if needed
            doc.addPage();
            currentY = 50;
        }

        const footerY = doc.page.height - 100;
        doc.rect(0, footerY - 20, doc.page.width, 120)
            .fillColor('#f9fafb')
            .fill();

        doc.fontSize(10)
            .fillColor('#6b7280')
            .text('VisionWest Work Order Management System', 50, footerY, { align: 'center', width: 500 })
            .text('This document contains confidential information and is intended for authorized personnel only.', 50, footerY + 15, { align: 'center', width: 500 })
            .fontSize(9)
            .fillColor('#9ca3af')
            .text('© 2025 Williams Property Services Group. All rights reserved.', 50, footerY + 35, { align: 'center', width: 500 });
    }
}

module.exports = PDFService;
