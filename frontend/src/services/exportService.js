import api from './api';
import { saveAs } from 'file-saver';

export const exportService = {
    // Export work order as PDF
    async exportWorkOrderPDF(workOrderId) {
        try {
            const response = await api.get(`/export/workorder/${workOrderId}/pdf`, {
                responseType: 'blob',
                headers: {
                    'Accept': 'application/pdf'
                }
            });

            // Create blob and download file
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const filename = `work-order-${workOrderId}.pdf`;
            saveAs(blob, filename);

            return {
                success: true,
                filename,
                message: 'PDF downloaded successfully'
            };
        } catch (error) {
            console.error('Error exporting work order PDF:', error);
            throw new Error(
                error.response?.data?.message || 'Failed to export work order as PDF'
            );
        }
    },

    // Get export status/capabilities
    async getExportStatus() {
        try {
            const response = await api.get('/export/status');
            return response.data;
        } catch (error) {
            console.error('Error getting export status:', error);
            throw new Error(
                error.response?.data?.message || 'Failed to get export status'
            );
        }
    }
};
