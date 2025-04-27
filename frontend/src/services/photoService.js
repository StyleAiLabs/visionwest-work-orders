import api from './api';

const photoService = {
    async uploadPhotos(workOrderId, files, description = '') {
        try {
            const formData = new FormData();

            // Append each file to the form data
            files.forEach(file => {
                formData.append('photos', file);
            });

            // Add description and work order ID
            formData.append('description', description);
            formData.append('workOrderId', workOrderId);

            // Custom config for multipart/form-data
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };

            // Update the endpoint to match the backend API
            const response = await api.post(`/photos/work-order/${workOrderId}`, formData, config);
            return response.data;
        } catch (error) {
            console.error('Error uploading photos:', error);
            throw error;
        }
    },

    async deletePhoto(photoId) {
        try {
            console.log('Deleting photo with ID:', photoId);
            // Make sure this endpoint matches your backend API
            const response = await api.delete(`/photos/${photoId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting photo:', error);
            throw error;
        }
    }
};

export default photoService;