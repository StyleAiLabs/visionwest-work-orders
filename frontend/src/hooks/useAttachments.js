// T064: Custom hook for attachment management
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { quoteService } from '../services/quoteService';
import { validateFile, validateFileCount, MAX_FILES_PER_QUOTE } from '../utils/fileValidation';

/**
 * Custom hook for managing quote attachments
 * @param {string|null} quoteId - The quote ID (null for new quotes)
 * @returns {object} Attachment state and handlers
 */
export const useAttachments = (quoteId = null) => {
    const [attachments, setAttachments] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    /**
     * Load attachments from server
     */
    const loadAttachments = useCallback(async () => {
        if (!quoteId) return;

        try {
            setLoading(true);
            const response = await quoteService.getAttachments(quoteId);
            if (response.success) {
                setAttachments(response.data || []);
            }
        } catch (error) {
            console.error('Error loading attachments:', error);
            toast.error('Failed to load attachments');
        } finally {
            setLoading(false);
        }
    }, [quoteId]);

    /**
     * Handle file selection with validation
     */
    const handleFileSelect = useCallback((files) => {
        const fileArray = Array.from(files);

        // Check total file limit
        const countError = validateFileCount(
            attachments.length + selectedFiles.length,
            fileArray.length
        );
        if (countError) {
            toast.error(countError);
            return false;
        }

        // Validate each file
        const validFiles = [];
        for (const file of fileArray) {
            const error = validateFile(file);
            if (error) {
                toast.error(error);
            } else {
                validFiles.push(file);
            }
        }

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
            return true;
        }

        return false;
    }, [attachments.length, selectedFiles.length]);

    /**
     * Upload selected files to server
     */
    const uploadFiles = useCallback(async (targetQuoteId) => {
        if (selectedFiles.length === 0) return true;

        const uploadQuoteId = targetQuoteId || quoteId;
        if (!uploadQuoteId) {
            toast.error('Cannot upload files without a quote ID');
            return false;
        }

        try {
            setUploading(true);
            const response = await quoteService.uploadAttachments(uploadQuoteId, selectedFiles);

            if (response.success) {
                // Reload attachments to get the uploaded files
                await loadAttachments();
                // Clear selected files
                setSelectedFiles([]);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error uploading attachments:', error);
            toast.error('Failed to upload some files. Please try again.');
            return false;
        } finally {
            setUploading(false);
        }
    }, [selectedFiles, quoteId, loadAttachments]);

    /**
     * Remove a file from selected files (before upload)
     */
    const removeSelectedFile = useCallback((index) => {
        setSelectedFiles(prev => {
            const newFiles = [...prev];
            newFiles.splice(index, 1);
            return newFiles;
        });
    }, []);

    /**
     * Delete an uploaded attachment
     */
    const deleteAttachment = useCallback(async (attachmentId) => {
        try {
            await quoteService.deleteAttachment(attachmentId);
            await loadAttachments();
            toast.success('Attachment deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting attachment:', error);
            toast.error('Failed to delete attachment');
            return false;
        }
    }, [loadAttachments]);

    /**
     * Clear all selected files
     */
    const clearSelectedFiles = useCallback(() => {
        setSelectedFiles([]);
    }, []);

    /**
     * Check if file limit is reached
     */
    const isFileLimitReached = useCallback(() => {
        return attachments.length + selectedFiles.length >= MAX_FILES_PER_QUOTE;
    }, [attachments.length, selectedFiles.length]);

    /**
     * Get total file count
     */
    const getTotalFileCount = useCallback(() => {
        return attachments.length + selectedFiles.length;
    }, [attachments.length, selectedFiles.length]);

    return {
        // State
        attachments,
        selectedFiles,
        uploading,
        loading,

        // Handlers
        loadAttachments,
        handleFileSelect,
        uploadFiles,
        removeSelectedFile,
        deleteAttachment,
        clearSelectedFiles,

        // Helpers
        isFileLimitReached,
        getTotalFileCount
    };
};
