import React from 'react';
import { Link } from 'react-router-dom';

const PhotoGallery = ({ photos, workOrderId }) => {
    return (
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
                    photos.map((photo, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-md overflow-hidden relative">
                            <img
                                src={photo.url}
                                alt={`Work order photo ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
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
    );
};

export default PhotoGallery;