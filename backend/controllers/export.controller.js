const PDFService = require('../services/pdfService');

const exportWorkOrderPDF = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Work order ID is required'
            });
        }

        console.log(`Export request for work order ID: ${id}`);

        // Generate PDF
        const pdfBuffer = await PDFService.generateWorkOrderPDF(id);

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="work-order-${id}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        console.log(`PDF export successful for work order ID: ${id}`);

        // Send PDF buffer
        res.end(pdfBuffer);

    } catch (error) {
        console.error('Error exporting work order PDF:', error);

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF export',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getExportStatus = async (req, res) => {
    try {
        // This could be expanded to handle async export jobs in the future
        res.json({
            success: true,
            message: 'PDF export is available',
            features: {
                workOrderDetails: true,
                propertyInformation: true,
                workDescription: true,
                photos: true,
                notes: true,
                statusHistory: true
            }
        });
    } catch (error) {
        console.error('Error getting export status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get export status'
        });
    }
};

module.exports = {
    exportWorkOrderPDF,
    getExportStatus
};
