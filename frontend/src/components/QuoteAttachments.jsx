import { useEffect } from 'react';
import { toast } from 'react-toastify';
import ThumbnailGallery from './ThumbnailGallery';
import { useAttachments } from '../hooks/useAttachments';

const QuoteAttachments = ({ quoteId, canUpload = false }) => {
    const {
        attachments,
        selectedFiles,
        uploading,
        loading,
        loadAttachments,
        handleFileSelect,
        uploadFiles,
        deleteAttachment
    } = useAttachments(quoteId);

    useEffect(() => {
        if (quoteId) {
            loadAttachments();
        }
    }, [quoteId, loadAttachments]);

    const handleFileInputChange = (e) => {
        handleFileSelect(e.target.files);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.warning('Please select files to upload');
            return;
        }

        const success = await uploadFiles(quoteId);
        if (success) {
            // Reset file input
            document.getElementById('file-input').value = '';
        }
    };

    const handleDelete = async (attachmentId) => {
        if (!confirm('Are you sure you want to delete this attachment?')) {
            return;
        }

        await deleteAttachment(attachmentId);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Attachments</h3>
                <p className="text-gray-500">Loading attachments...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">
                Attachments ({attachments.length})
            </h3>

            {/* Upload Section - Only if user can upload */}
            {canUpload && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Files
                    </label>
                    <input
                        id="file-input"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                        onChange={handleFileInputChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-nextgen-green file:text-white hover:file:bg-nextgen-green-dark cursor-pointer"
                    />
                    {selectedFiles.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-2">
                                Selected: {selectedFiles.length} file(s)
                            </p>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="px-4 py-2 bg-nextgen-green text-white rounded-lg hover:bg-nextgen-green-dark disabled:opacity-50 text-sm font-medium"
                            >
                                {uploading ? 'Uploading...' : 'Upload Files'}
                            </button>
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                        Supported formats: Images, PDF, Word, Excel, Text (Max 10MB per file, 5 files at once)
                    </p>
                </div>
            )}

            {/* Attachments Display - Using ThumbnailGallery */}
            {attachments.length === 0 ? (
                <p className="text-gray-500 text-sm">No attachments yet</p>
            ) : (
                <ThumbnailGallery
                    attachments={attachments}
                    onDelete={canUpload ? handleDelete : null}
                    showDelete={canUpload}
                />
            )}
        </div>
    );
};

export default QuoteAttachments;
