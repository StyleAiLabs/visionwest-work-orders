import api from './api';
import { toast } from 'react-toastify'; // T029: Error handling with toasts

/**
 * Quote Service
 *
 * Handles all API calls for quote operations:
 * - Create, update, submit quotes
 * - View quotes and quote details
 * - Provide, approve, decline quotes
 * - Convert quotes to work orders
 * - Quote messaging and attachments
 */

/**
 * Add X-Client-Context header for admin context switching
 * @param {Object} config - Axios config object
 * @param {number|null} clientId - Client ID to switch context to (admin only)
 * @returns {Object} Config with X-Client-Context header if applicable
 */
const addClientContextHeader = (config = {}, clientId = null) => {
    if (clientId) {
        return {
            ...config,
            headers: {
                ...config.headers,
                'X-Client-Context': clientId
            }
        };
    }
    return config;
};

export const quoteService = {
    // ========================================================================
    // T026: Create new quote (POST /api/quotes)
    // ========================================================================
    async createQuote(quoteData, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.post('/quotes', quoteData, config);

            // T029: Success toast
            if (response.data.success) {
                toast.success('Quote draft created successfully');
            }

            return response.data;
        } catch (error) {
            console.error('Error creating quote:', error);

            // T029: Error handling with toast
            const errorMessage = error.response?.data?.message || 'Error creating quote. Please try again.';
            toast.error(errorMessage);

            throw error;
        }
    },

    // ========================================================================
    // T027: Update draft quote (PATCH /api/quotes/:id)
    // ========================================================================
    async updateQuote(quoteId, updateData, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.patch(`/quotes/${quoteId}`, updateData, config);

            // T029: Success toast (silent for auto-save, shown for manual save)
            if (updateData._showToast !== false) {
                if (response.data.success) {
                    toast.success('Quote updated successfully');
                }
            }

            return response.data;
        } catch (error) {
            console.error('Error updating quote:', error);

            // T029: Error handling with toast
            const errorMessage = error.response?.data?.message || 'Error updating quote. Please try again.';
            toast.error(errorMessage);

            throw error;
        }
    },

    // ========================================================================
    // T028: Submit quote for review (POST /api/quotes/:id/submit)
    // ========================================================================
    async submitQuote(quoteId, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.post(`/quotes/${quoteId}/submit`, {}, config);

            // T029: Success toast
            if (response.data.success) {
                const quoteNumber = response.data.data?.quote_number;
                toast.success(`Quote ${quoteNumber} submitted successfully!`);
            }

            return response.data;
        } catch (error) {
            console.error('Error submitting quote:', error);

            // T029: Error handling with toast
            const errorMessage = error.response?.data?.message || 'Error submitting quote. Please try again.';
            toast.error(errorMessage);

            throw error;
        }
    },

    // ========================================================================
    // Future Phase Methods (Phase 4+)
    // ========================================================================

    /**
     * Get all quotes with filters (Phase 4: US2.1)
     */
    async getQuotes(filters = {}, clientId = null) {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            if (filters.urgency && filters.urgency !== '') params.append('urgency', filters.urgency);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            if (filters.clientId) params.append('clientId', filters.clientId);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const config = addClientContextHeader({}, clientId);
            const response = await api.get(`/quotes?${params}`, config);
            return response.data;
        } catch (error) {
            console.error('Error fetching quotes:', error);
            toast.error('Error loading quotes');
            throw error;
        }
    },

    /**
     * Get quote by ID (Phase 4: US2.1)
     */
    async getQuoteById(quoteId, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.get(`/quotes/${quoteId}`, config);
            return response.data;
        } catch (error) {
            console.error('Error fetching quote:', error);
            toast.error('Error loading quote details');
            throw error;
        }
    },

    /**
     * Get quote summary for dashboard (Phase 5: US5.1)
     */
    async getQuoteSummary(clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.get('/quotes/summary', config);
            return response.data;
        } catch (error) {
            console.error('Error fetching quote summary:', error);
            throw error;
        }
    },

    /**
     * Staff provides quote (Phase 6: US2.2)
     */
    async provideQuote(quoteId, quoteDetails, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.patch(`/quotes/${quoteId}/provide-quote`, quoteDetails, config);

            if (response.data.success) {
                toast.success('Quote provided successfully');
            }

            return response.data;
        } catch (error) {
            console.error('Error providing quote:', error);
            toast.error('Error providing quote');
            throw error;
        }
    },

    /**
     * Client admin approves quote (Phase 8: US3.2)
     */
    async approveQuote(quoteId, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.patch(`/quotes/${quoteId}/approve`, {}, config);

            if (response.data.success) {
                toast.success('Quote approved successfully!');
            }

            return response.data;
        } catch (error) {
            console.error('Error approving quote:', error);
            const errorMessage = error.response?.data?.message || 'Error approving quote';
            toast.error(errorMessage);
            throw error;
        }
    },

    /**
     * Decline quote (Phase 11/12: US2.4/US3.3)
     */
    async declineQuote(quoteId, reason, isStaff = false, clientId = null) {
        try {
            const endpoint = isStaff ? `/quotes/${quoteId}/decline` : `/quotes/${quoteId}/decline-quote`;
            const config = addClientContextHeader({}, clientId);
            const response = await api.patch(endpoint, { decline_reason: reason }, config);

            if (response.data.success) {
                toast.success('Quote declined');
            }

            return response.data;
        } catch (error) {
            console.error('Error declining quote:', error);
            toast.error('Error declining quote');
            throw error;
        }
    },

    /**
     * Staff requests more information (Phase 10: US2.3)
     */
    async requestInfo(quoteId, message, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.patch(`/quotes/${quoteId}/request-info`, { message }, config);

            if (response.data.success) {
                toast.success('Information requested');
            }

            return response.data;
        } catch (error) {
            console.error('Error requesting information:', error);
            toast.error('Error requesting information');
            throw error;
        }
    },

    /**
     * Convert approved quote to work order (Phase 9: US4.1)
     */
    async convertToWorkOrder(quoteId, workOrderData = {}, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.post(`/quotes/${quoteId}/convert`, workOrderData, config);

            if (response.data.success) {
                const jobNo = response.data.data?.work_order?.job_no;
                toast.success(`Quote converted to work order ${jobNo}`);
            }

            return response.data;
        } catch (error) {
            console.error('Error converting quote to work order:', error);
            toast.error('Error converting quote to work order');
            throw error;
        }
    },

    /**
     * Upload attachments (Phase 6: US2.2)
     */
    async uploadAttachments(quoteId, files, clientId = null) {
        try {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('attachments', files[i]);
            }

            const config = addClientContextHeader({
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }, clientId);

            const response = await api.post(`/quotes/${quoteId}/attachments`, formData, config);

            if (response.data.success) {
                toast.success(`${files.length} file(s) uploaded successfully`);
            }

            return response.data;
        } catch (error) {
            console.error('Error uploading attachments:', error);
            toast.error('Error uploading files');
            throw error;
        }
    },

    /**
     * Delete a quote attachment
     */
    async deleteAttachment(attachmentId, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.delete(`/quotes/attachments/${attachmentId}`, config);

            if (response.data.success) {
                toast.success('Attachment deleted successfully');
            }

            return response.data;
        } catch (error) {
            console.error('Error deleting attachment:', error);
            toast.error('Error deleting attachment');
            throw error;
        }
    },

    /**
     * Get quote attachments (Phase 6: US2.2)
     */
    async getAttachments(quoteId, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.get(`/quotes/${quoteId}/attachments`, config);
            return response.data;
        } catch (error) {
            console.error('Error fetching attachments:', error);
            throw error;
        }
    },

    /**
     * Add message to quote (Phase 10/16: US2.3/US3.4)
     */
    async addMessage(quoteId, message, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.post(`/quotes/${quoteId}/messages`, { message }, config);
            return response.data;
        } catch (error) {
            console.error('Error adding message:', error);
            toast.error('Error sending message');
            throw error;
        }
    },

    /**
     * Get quote messages (Phase 10/16: US2.3/US3.4)
     */
    async getMessages(quoteId, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.get(`/quotes/${quoteId}/messages`, config);
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    },

    /**
     * Request more information from client (T123: Phase 10: US2.3)
     */
    async requestInfo(quoteId, message, clientId = null) {
        try {
            const config = addClientContextHeader({}, clientId);
            const response = await api.patch(`/quotes/${quoteId}/request-info`, { message }, config);

            if (response.data.success) {
                toast.success('Information requested successfully');
            }

            return response.data;
        } catch (error) {
            console.error('Error requesting information:', error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Error requesting information');
            }
            throw error;
        }
    }
};

export default quoteService;
