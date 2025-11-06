import React, { useState } from 'react';

// T024-T030: ThumbnailGallery component for displaying uploaded images as thumbnails
const ThumbnailGallery = ({ attachments, onDelete, showDelete = true }) => {
    const [imageError, setImageError] = useState({});
    const [imageLoading, setImageLoading] = useState({});

    // T026: Check if file is an image
    const isImage = (file) => {
        if (file.fileType === 'photo') return true;
        if (file.type) {
            return file.type.startsWith('image/');
        }
        if (file.filename) {
            const ext = file.filename.toLowerCase().split('.').pop();
            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
        }
        return false;
    };

    // T026: Get file icon for non-image files
    const getFileIcon = (file) => {
        const filename = file.filename || file.name || '';
        const ext = filename.toLowerCase().split('.').pop();

        if (ext === 'pdf') return '📄';
        if (['doc', 'docx'].includes(ext)) return '📝';
        if (['xls', 'xlsx'].includes(ext)) return '📊';
        if (['txt', 'csv'].includes(ext)) return '📃';
        return '📎';
    };

    // T029: Handle image load start
    const handleImageLoadStart = (fileId) => {
        setImageLoading(prev => ({ ...prev, [fileId]: true }));
    };

    // T029: Handle image load success
    const handleImageLoad = (fileId) => {
        setImageLoading(prev => ({ ...prev, [fileId]: false }));
    };

    // T030: Handle image load error (fallback to icon)
    const handleImageError = (fileId) => {
        setImageError(prev => ({ ...prev, [fileId]: true }));
        setImageLoading(prev => ({ ...prev, [fileId]: false }));
    };

    // T031: Handle thumbnail click to open full-size image
    const handleThumbnailClick = (file) => {
        const url = file.url || (file instanceof File ? URL.createObjectURL(file) : null);
        if (url) {
            window.open(url, '_blank');
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (!attachments || attachments.length === 0) {
        return null;
    }

    // Separate images and documents
    const images = attachments.filter(file => isImage(file));
    const documents = attachments.filter(file => !isImage(file));

    return (
        <div className="space-y-4">
            {/* T025, T027: Image Thumbnails Gallery */}
            {images.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                        Images ({images.length})
                    </p>
                    {/* T027: CSS Grid layout for responsive thumbnails */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {images.map((file, index) => {
                            const fileId = file.id || `temp-${index}`;
                            const hasError = imageError[fileId];
                            const isLoading = imageLoading[fileId];

                            return (
                                <div
                                    key={fileId}
                                    className="relative group"
                                >
                                    {/* T028, T032: Thumbnail with hover effect */}
                                    <div
                                        onClick={() => handleThumbnailClick(file)}
                                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 cursor-pointer transition-all duration-200 hover:border-nextgen-green hover:shadow-lg hover:scale-105"
                                    >
                                        {/* T029: Loading state */}
                                        {isLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-nextgen-green"></div>
                                            </div>
                                        )}

                                        {/* T025, T028: Image thumbnail or fallback icon */}
                                        {!hasError ? (
                                            <img
                                                src={file.url || (file instanceof File ? URL.createObjectURL(file) : '')}
                                                alt={file.filename || file.name || 'Attachment'}
                                                className="w-full h-full object-cover"
                                                onLoadStart={() => handleImageLoadStart(fileId)}
                                                onLoad={() => handleImageLoad(fileId)}
                                                onError={() => handleImageError(fileId)}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">
                                                🖼️
                                            </div>
                                        )}

                                        {/* T033: Filename overlay on hover */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                                            <p className="truncate">{file.filename || file.name}</p>
                                            {/* T034: File size and upload date */}
                                            <p className="text-gray-300 text-[10px] mt-1">
                                                {formatFileSize(file.fileSize || file.size)}
                                                {file.uploadedAt && ` • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Delete button */}
                                    {showDelete && onDelete && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(file.id || index);
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 z-10"
                                            title="Delete attachment"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* T026: Non-image files (documents) */}
            {documents.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Documents ({documents.length})
                    </p>
                    <div className="space-y-2">
                        {documents.map((file, index) => (
                            <div
                                key={file.id || `doc-${index}`}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors group"
                            >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <span className="text-2xl">{getFileIcon(file)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {file.filename || file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(file.fileSize || file.size)}
                                            {file.uploadedAt && ` • Uploaded ${new Date(file.uploadedAt).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <a
                                        href={file.url || (file instanceof File ? URL.createObjectURL(file) : '#')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        View
                                    </a>
                                    {showDelete && onDelete && (
                                        <button
                                            type="button"
                                            onClick={() => onDelete(file.id || index)}
                                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThumbnailGallery;
