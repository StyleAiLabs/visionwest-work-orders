import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import Button from '../components/common/Button';
import api from '../services/api';

const PhotoUploadPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workOrder, setWorkOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Fetch work order basic info
    useEffect(() => {
        const fetchWorkOrder = async () => {
            try {
                setIsLoading(true);
                // In a real implementation, this would be an actual API call
                // const response = await api.get(`/work-orders/${id}/basic`);
                // setWorkOrder(response.data);

                // Mock data for development
                setTimeout(() => {
                    setWorkOrder({
                        id: id,
                        jobNo: 'RBWO010965',
                        property: 'VisionWest Community Trust'
                    });
                    setIsLoading(false);
                }, 500);
            } catch (error) {
                console.error('Error fetching work order details:', error);
                setIsLoading(false);
            }
        };

        fetchWorkOrder();
    }, [id]);

    // Handle file selection
    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);

        // Create preview URLs for the selected files
        const newPhotos = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));

        setSelectedPhotos(prev => [...prev, ...newPhotos]);
    };

    // Remove a photo from the selection
    const handleRemovePhoto = (index) => {
        setSelectedPhotos(prev => {
            const newPhotos = [...prev];
            // Revoke the object URL to avoid memory leaks
            URL.revokeObjectURL(newPhotos[index].previewUrl);
            newPhotos.splice(index, 1);
            return newPhotos;
        });
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (selectedPhotos.length === 0) {
            alert('Please select at least one photo to upload');
            return;
        }

        setIsUploading(true);

        try {
            // In a real implementation, this would upload photos via API
            // const formData = new FormData();
            // selectedPhotos.forEach(photo => {
            //   formData.append('photos', photo.file);
            // });
            // formData.append('description', description);
            // await api.post(`/work-orders/${id}/photos`, formData);

            // Mock upload delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Navigate back to work order detail page after successful upload
            navigate(`/work-orders/${id}`);
        } catch (error) {
            console.error('Error uploading photos:', error);
            setIsUploading(false);
        }
    };

    // Header with check button for completion
    const headerRightContent = (
        <button
            onClick={handleSubmit}
            disabled={isUploading || selectedPhotos.length === 0}
            className={`p-1 rounded-full ${isUploading || selectedPhotos.length === 0
                ? 'text-gray-400'
                : 'hover:bg-indigo-500'
                }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </button>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <AppHeader
                title="Add Photos"
                showBackButton={true}
                onBackClick={() => navigate(`/work-orders/${id}`)}
                rightContent={headerRightContent}
            />

            {/* Upload Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Job #{workOrder.jobNo}</h3>
                    <p className="text-xs text-gray-500">{workOrder.property}</p>
                </div>

                {/* Camera/Upload Interface */}
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">Take a photo or upload from gallery</p>
                        <div className="mt-4 flex space-x-3">
                            <label className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
                                Camera
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="camera"
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                />
                            </label>
                            <label className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
                                Gallery
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Preview Images */}
                {selectedPhotos.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                        <h2 className="text-md font-semibold mb-3">Selected Photos ({selectedPhotos.length})</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {selectedPhotos.map((photo, index) => (
                                <div key={index} className="relative">
                                    <div className="aspect-square bg-gray-200 rounded-md overflow-hidden">
                                        <img
                                            src={photo.previewUrl}
                                            alt={`Selected photo ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1"
                                        onClick={() => handleRemovePhoto(index)}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Photo Description */}
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Add Description
                    </label>
                    <textarea
                        id="description"
                        rows="3"
                        className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                        placeholder="Describe the photos you're uploading..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>

                {/* Upload Button */}
                <Button
                    fullWidth
                    disabled={isUploading || selectedPhotos.length === 0}
                    onClick={handleSubmit}
                >
                    {isUploading ? 'Uploading...' : 'Upload Photos'}
                </Button>
            </div>
        </div>
    );
};

export default PhotoUploadPage;