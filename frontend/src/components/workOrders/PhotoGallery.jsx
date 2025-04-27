import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import photoService from '../../services/photoService';

const PhotoGallery = ({ photos = [], workOrderId, onPhotoDeleted }) => {
    const [showFullImage, setShowFullImage] = useState(false);
    const [currentPhoto, setCurrentPhoto] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState(null);

    const openPhotoViewer = (photo) => {
        setCurrentPhoto(photo);
        setShowFullImage(true);
    };

    const closePhotoViewer = () => {
        setShowFullImage(false);
        setCurrentPhoto(null);
        setShowDeleteConfirm(false);
        setPhotoToDelete(null);
    };

    // Next and previous photo navigation
    const goToNextPhoto = () => {
        const currentIndex = photos.findIndex(photo => photo.id === currentPhoto.id);
        const nextIndex = (currentIndex + 1) % photos.length;
        setCurrentPhoto(photos[nextIndex]);
        setShowDeleteConfirm(false);
    };

    const goToPrevPhoto = () => {
        const currentIndex = photos.findIndex(photo => photo.id === currentPhoto.id);
        const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
        setCurrentPhoto(photos[prevIndex]);
        setShowDeleteConfirm(false);
    };

    // Improved delete click handler
    const handleDeleteClick = (e, photo) => {
        // These prevent the photo viewer from opening
        e.preventDefault();
        e.stopPropagation();

        console.log('Delete clicked for photo:', photo.id);
        setPhotoToDelete(photo);
        setShowDeleteConfirm(true);
    };

    // Confirm deletion action
    const confirmDelete = async () => {
        if (!photoToDelete || isDeleting) return;

        try {
            setIsDeleting(true);
            console.log('Deleting photo with ID:', photoToDelete.id);

            // Call the API to delete the photo
            await photoService.deletePhoto(photoToDelete.id);

            // Close the viewer and confirmation dialog
            setShowDeleteConfirm(false);

            if (showFullImage) {
                closePhotoViewer();
            }

            // Notify parent component to refresh photos
            if (onPhotoDeleted) {
                onPhotoDeleted();
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
        } finally {
            setIsDeleting(false);
            setPhotoToDelete(null);
        }
    };

    // Full screen delete button handler
    const handleFullScreenDelete = () => {
        if (!currentPhoto) return;
        setPhotoToDelete(currentPhoto);
        setShowDeleteConfirm(true);
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-md font-semibold">Photos</h2>
                    <Link
                        to={`/work-orders/${workOrderId}/photos/add`}
                        className="text-white bg-indigo-600 py-1 px-3 rounded-md text-sm flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Photo
                    </Link>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-3 gap-2">
                    {photos && photos.length > 0 ? (
                        photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="aspect-square bg-gray-100 rounded-md overflow-hidden relative group"
                            >
                                {/* Photo container - separate click handler */}
                                <div
                                    className="w-full h-full cursor-pointer"
                                    onClick={() => openPhotoViewer(photo)}
                                >
                                    <img
                                        src={photo.url}
                                        alt={photo.description || `Work order photo`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Delete button - positioned on top with higher z-index */}
                                <div
                                    className="absolute top-1 right-1 z-20"
                                    onClick={(e) => handleDeleteClick(e, photo)}
                                >
                                    <button
                                        className="bg-black bg-opacity-60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        type="button"
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {/* Description indicator */}
                                {photo.description && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-3 w-3 inline-block mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                            />
                                        </svg>
                                        {photo.description.substring(0, 15)}{photo.description.length > 15 ? '...' : ''}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        // Placeholder items when no photos
                        Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="aspect-square bg-gray-100 rounded-md overflow-hidden relative">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Full Image Viewer Modal */}
            {showFullImage && currentPhoto && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
                    {/* Top Bar */}
                    <div className="p-4 flex justify-between items-center">
                        <div className="text-white text-sm max-w-[80%]">
                            {currentPhoto.description && (
                                <p className="text-white">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 inline-block mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                        />
                                    </svg>
                                    {currentPhoto.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={handleFullScreenDelete}
                                className="text-white p-2 mr-2"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={closePhotoViewer}
                                className="text-white p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Image Container */}
                    <div className="flex-1 flex items-center justify-center p-4">
                        <img
                            src={currentPhoto.url}
                            alt={currentPhoto.description || "Work order photo"}
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>

                    {/* Navigation Buttons - only show if there's more than one photo */}
                    {photos.length > 1 && (
                        <div className="absolute inset-y-0 flex items-center justify-between w-full px-4 pointer-events-none">
                            <button
                                onClick={goToPrevPhoto}
                                className="bg-black bg-opacity-50 text-white rounded-full p-2 pointer-events-auto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={goToNextPhoto}
                                className="bg-black bg-opacity-50 text-white rounded-full p-2 pointer-events-auto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && photoToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-xs w-full p-4 mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Photo</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Are you sure you want to delete this photo? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PhotoGallery;