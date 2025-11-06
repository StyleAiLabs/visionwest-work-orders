// T068: File validation utility functions

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum number of files per quote
 */
export const MAX_FILES_PER_QUOTE = 5;

/**
 * Allowed file MIME types
 */
export const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
];

/**
 * Validate file size
 * @param {File} file - The file to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateFileSize = (file) => {
    if (file.size > MAX_FILE_SIZE) {
        return `File "${file.name}" is too large. Maximum size is 10MB.`;
    }
    return null;
};

/**
 * Validate file type
 * @param {File} file - The file to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateFileType = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return `File "${file.name}" has an invalid type. Only images and documents (PDF, Word, Excel, Text) are allowed.`;
    }
    return null;
};

/**
 * Validate a single file (size and type)
 * @param {File} file - The file to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateFile = (file) => {
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const typeError = validateFileType(file);
    if (typeError) return typeError;

    return null;
};

/**
 * Validate total file count
 * @param {number} currentCount - Current number of files
 * @param {number} newCount - Number of files to add
 * @returns {string|null} Error message or null if valid
 */
export const validateFileCount = (currentCount, newCount) => {
    if (currentCount + newCount > MAX_FILES_PER_QUOTE) {
        return `Maximum ${MAX_FILES_PER_QUOTE} files allowed per quote`;
    }
    return null;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
