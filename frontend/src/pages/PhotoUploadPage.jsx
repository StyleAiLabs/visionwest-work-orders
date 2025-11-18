import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import Button from '../components/common/Button';
import { workOrderService } from '../services/workOrderService';
// Update this import to use the default export
import photoService from '../services/photoService';
import Toast from '../components/common/Toast';

const PhotoUploadPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workOrder, setWorkOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    const MAX_PHOTOS = 20;

    // Show toast message
    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    };

    // Fetch work order basic info
    useEffect(() => {
        const fetchWorkOrder = async () => {
            try {
                setIsLoading(true);
                const response = await workOrderService.getWorkOrderById(id);
                setWorkOrder({
                    id: response.data.id,
                    jobNo: response.data.jobNo,
                    property: response.data.property.name
                });
            } catch (error) {
                console.error('Error fetching work order details:', error);
                showToast('Failed to load work order details', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkOrder();
    }, [id]);

    // Handle file selection
    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);

        // Check if adding these files would exceed the max limit
        if (selectedPhotos.length + files.length > MAX_PHOTOS) {
            showToast(`Maximum ${MAX_PHOTOS} photos allowed. You can select ${MAX_PHOTOS - selectedPhotos.length} more.`, 'error');
            return;
        }

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max

            if (!isValidType) {
                showToast('Only image files are allowed', 'error');
            }
            if (!isValidSize) {
                showToast('Image file size must be less than 5MB', 'error');
            }

            return isValidType && isValidSize;
        });

        // Create preview URLs for the selected files
        const newPhotos = validFiles.map(file => ({
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
            showToast('Please select at least one photo to upload', 'error');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Extract just the File objects for upload
            const files = selectedPhotos.map(photo => photo.file);

            // Upload the photos using the service with progress tracking
            await photoService.uploadPhotos(id, files, description, (progress) => {
                setUploadProgress(progress);
            });

            showToast('Photos uploaded successfully', 'success');

            // Navigate back to work order detail page after successful upload
            setTimeout(() => {
                navigate(`/work-orders/${id}`);
            }, 1000);
        } catch (error) {
            console.error('Error uploading photos:', error);
            showToast('Failed to upload photos. Please try again.', 'error');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Clean up object URLs when component unmounts
    useEffect(() => {
        return () => {
            selectedPhotos.forEach(photo => {
                URL.revokeObjectURL(photo.previewUrl);
            });
        };
    }, []);

    // Update the header button styles

    const headerRightContent = (
        <button
            onClick={handleSubmit}
            disabled={isUploading || selectedPhotos.length === 0}
            className={`p-1 rounded-full ${isUploading || selectedPhotos.length === 0
                ? 'text-gray-400'
                : 'hover:bg-nextgen-green'
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nextgen-green"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AppHeader
                title="Add Photos"
                showBackButton={true}
                onBackClick={() => navigate(`/work-orders/${id}`)}
                rightContent={headerRightContent}
            />

            {/* Upload Content */}
            <div className="pt-16 overflow-y-auto p-4">
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
                        <p className="mt-1 text-xs text-gray-500">Max 20 photos, 5MB each</p>
                        <div className="mt-4 flex space-x-3">
                            <label className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
                                Camera
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="camera"
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                    disabled={isUploading}
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
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Preview Images */}
                {selectedPhotos.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                        <h2 className="text-md font-semibold mb-3">Selected Photos ({selectedPhotos.length}/{MAX_PHOTOS})</h2>

                        {/* Upload Progress Bar */}
                        {isUploading && (
                            <div className="mb-4">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">Uploading...</span>
                                    <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-nextgen-green h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

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
                                        disabled={isUploading}
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
                        disabled={isUploading}
                    ></textarea>
                </div>

                {/* Upload Button */}
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isUploading || selectedPhotos.length === 0}
                >
                    {isUploading ? 'Uploading...' : 'Upload Photos'}
                </Button>
            </div>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: '', type: 'error' })}
                />
            )}
        </div>
    );
};

export default PhotoUploadPage;