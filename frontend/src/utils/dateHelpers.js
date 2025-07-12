// frontend/src/utils/dateHelpers.js
// Utility functions for date formatting

/**
 * Format a date string or Date object into a readable format
 * @param {string|Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    if (!date) return 'N/A';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
            return 'Invalid Date';
        }

        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        };

        return dateObj.toLocaleDateString('en-NZ', defaultOptions);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'N/A';
    }
};

/**
 * Format a date to show relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} date - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
    if (!date) return 'N/A';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffInMs = now - dateObj;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        } else {
            return formatDate(dateObj);
        }
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return 'N/A';
    }
};

/**
 * Format a date with time included
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
    if (!date) return 'N/A';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) {
            return 'Invalid Date';
        }

        return dateObj.toLocaleDateString('en-NZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date time:', error);
        return 'N/A';
    }
};

/**
 * Check if a date is today
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
    if (!date) return false;

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();

        return dateObj.toDateString() === today.toDateString();
    } catch (error) {
        return false;
    }
};

/**
 * Check if a date is in the past
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
export const isPast = (date) => {
    if (!date) return false;

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();

        return dateObj < now;
    } catch (error) {
        return false;
    }
};

/**
 * Get a formatted date string for input fields (YYYY-MM-DD)
 * @param {string|Date} date - The date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (date) => {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) {
            return '';
        }

        return dateObj.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date for input:', error);
        return '';
    }
};

// Export all functions as named exports
export default {
    formatDate,
    formatRelativeTime,
    formatDateTime,
    isToday,
    isPast,
    formatDateForInput
};
