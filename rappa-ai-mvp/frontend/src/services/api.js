/**
 * API Service
 *
 * Centralized API client for communicating with the rappa.ai backend
 */

import axios from 'axios';
import config from '../config';

// API Base URL from environment configuration
const API_BASE_URL = config.apiUrl;
const API_VERSION = '/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // IMPORTANT: Send cookies with requests
});

// Request interceptor - add timestamp to prevent caching
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    console.log(`🌐 [REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('🌐 [REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      // No need to clear localStorage - we're using HTTP-only cookies
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  /**
   * Sign up a new user
   * @param {Object} data - { email, password }
   * @returns {Promise} User data and access token
   *
   * NOTE: Authentication now uses HTTP-only cookies.
   * The access_token in the response is also stored as a secure cookie by the backend.
   */
  signup: async (data) => {
    const response = await apiClient.post('/auth/signup', data);
    // Cookie is automatically set by backend via Set-Cookie header
    // No need to store in localStorage
    return response.data;
  },

  /**
   * Log in an existing user
   * @param {Object} data - { email, password }
   * @returns {Promise} User data and access token
   *
   * NOTE: Authentication now uses HTTP-only cookies.
   * The access_token in the response is also stored as a secure cookie by the backend.
   */
  login: async (data) => {
    const response = await apiClient.post('/auth/login', data);
    // Cookie is automatically set by backend via Set-Cookie header
    // No need to store in localStorage
    return response.data;
  },

  /**
   * Get current user info
   * @returns {Promise} Current user data
   *
   * NOTE: Authentication is handled via HTTP-only cookies sent automatically.
   */
  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Log out the current user
   *
   * NOTE: This clears the HTTP-only cookie on the backend.
   */
  logout: async () => {
    await apiClient.post('/auth/logout');
    // Cookie is automatically cleared by backend via Set-Cookie with expired date
    // No need to clear localStorage
  },

  /**
   * Get credit transaction history
   * @param {number} limit - Maximum number of transactions to fetch
   * @returns {Promise} Credit history data
   */
  getCreditHistory: async (limit = 20) => {
    const response = await apiClient.get('/auth/credits/history', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Success message
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },

  /**
   * Request email change (sends verification to new email)
   * @param {string} newEmail - New email address
   * @param {string} password - Current password for verification
   * @returns {Promise} Success message
   */
  changeEmail: async (newEmail, password) => {
    const response = await apiClient.post('/auth/change-email/request', {
      new_email: newEmail,
      password: password
    });
    return response.data;
  },

  /**
   * Verify email change with token
   * @param {string} token - Email change verification token
   * @returns {Promise} Success message
   */
  verifyEmailChange: async (token) => {
    const response = await apiClient.post('/auth/change-email/verify', {
      token: token
    });
    return response.data;
  },

  /**
   * Request password reset email
   * @param {string} email - User email address
   * @returns {Promise} Success message
   */
  forgotPassword: async (email) => {
    console.log('🌐 [API] forgotPassword called with email:', email);
    console.log('🌐 [API] Request URL:', `${API_BASE_URL}${API_VERSION}/auth/forgot-password`);
    console.log('🌐 [API] Request body:', { email });

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: email
      });
      console.log('🌐 [API] Response received:', response);
      console.log('🌐 [API] Response data:', response.data);
      console.log('🌐 [API] Response status:', response.status);
      return response.data;
    } catch (error) {
      console.error('🌐 [API] Request failed:', error);
      console.error('🌐 [API] Error response:', error.response);
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise} Success message
   */
  resetPassword: async (token, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', {
      token: token,
      new_password: newPassword
    });
    return response.data;
  },
};

// ============================================================================
// UPLOAD API
// ============================================================================

export const uploadAPI = {
  /**
   * Upload a document for processing
   * @param {FormData|File} fileOrFormData - Document file or FormData with file and template_id
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise} Job data
   */
  uploadDocument: async (fileOrFormData, onProgress) => {
    let formData;

    // Handle both File and FormData inputs
    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData;
    } else {
      formData = new FormData();
      formData.append('file', fileOrFormData);
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for file uploads (S3/Backblaze can be slow)
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }

    const response = await apiClient.post('/upload/document', formData, config);
    return response.data;
  },
};

// ============================================================================
// PROCESSING API
// ============================================================================

export const processingAPI = {
  /**
   * Get job status
   * @param {number} jobId - Job ID
   * @returns {Promise} Job status data
   */
  getJobStatus: async (jobId) => {
    const response = await apiClient.get(`/processing/status/${jobId}`);
    return response.data;
  },

  /**
   * Get job results (extracted fields)
   * @param {number} jobId - Job ID
   * @returns {Promise} Job results with extracted fields
   */
  getJobResults: async (jobId) => {
    const response = await apiClient.get(`/processing/results/${jobId}`);
    return response.data;
  },

  /**
   * Get enhanced job results (with document type, summary, confidence)
   * @param {number} jobId - Job ID
   * @returns {Promise} Enhanced results
   */
  getJobResultsEnhanced: async (jobId) => {
    const response = await apiClient.get(`/processing/results/${jobId}/enhanced`);
    return response.data;
  },

  /**
   * Download Excel export of job results
   * @param {number} jobId - Job ID
   * @param {string} filename - Filename for download
   */
  downloadExcel: async (jobId, filename) => {
    const response = await apiClient.get(`/processing/results/${jobId}/export/excel`, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `results_${jobId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Get all jobs for current user
   * @param {Object} params - Query parameters (skip, limit, status)
   * @returns {Promise} List of jobs
   */
  getJobs: async (params = {}) => {
    const response = await apiClient.get('/processing/jobs', { params });
    return response.data;
  },

  /**
   * Delete a job
   * @param {number} jobId - Job ID
   * @returns {Promise} Success message
   */
  deleteJob: async (jobId) => {
    const response = await apiClient.delete(`/processing/${jobId}`);
    return response.data;
  },

  /**
   * Get processing statistics
   * @returns {Promise} Processing stats
   */
  getStats: async () => {
    const response = await apiClient.get('/processing/stats');
    return response.data;
  },
};

// ============================================================================
// TEMPLATES API
// ============================================================================

export const templatesAPI = {
  /**
   * Get all available templates
   * @returns {Promise} List of templates
   */
  getAll: async () => {
    const response = await apiClient.get('/templates');
    return response.data;
  },

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise} Template details
   */
  getById: async (templateId) => {
    const response = await apiClient.get(`/templates/${templateId}`);
    return response.data;
  },

  /**
   * Get templates by category
   * @returns {Promise} Templates grouped by category
   */
  getCategories: async () => {
    const response = await apiClient.get('/templates/categories');
    return response.data;
  },
};

// ============================================================================
// FIELDS API
// ============================================================================

export const fieldsAPI = {
  /**
   * Get all fields for a job
   * @param {number} jobId - Job ID
   * @returns {Promise} List of extracted fields
   */
  getJobFields: async (jobId) => {
    const response = await apiClient.get(`/fields/job/${jobId}`);
    return response.data;
  },

  /**
   * Update a single field
   * @param {number} fieldId - Field ID
   * @param {string} editedValue - New value
   * @returns {Promise} Update result
   */
  updateField: async (fieldId, editedValue) => {
    const response = await apiClient.patch(`/fields/${fieldId}`, { edited_value: editedValue });
    return response.data;
  },

  /**
   * Batch update multiple fields
   * @param {number} jobId - Job ID
   * @param {Array} updates - Array of {field_id, edited_value}
   * @returns {Promise} Update result
   */
  batchUpdate: async (jobId, updates) => {
    const response = await apiClient.post(`/fields/batch-update`, { job_id: jobId, updates });
    return response.data;
  },

  /**
   * Reset field to original value
   * @param {number} fieldId - Field ID
   * @returns {Promise} Reset result
   */
  resetField: async (fieldId) => {
    const response = await apiClient.post(`/fields/${fieldId}/reset`);
    return response.data;
  },
};

// ============================================================================
// EXPORT API
// ============================================================================

export const exportAPI = {
  /**
   * Download CSV export
   * @param {number} jobId - Job ID
   * @param {string} filename - Filename for download
   */
  downloadCSV: async (jobId, filename) => {
    const response = await apiClient.get(`/export/job/${jobId}/csv`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `results_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download JSON export
   * @param {number} jobId - Job ID
   * @param {string} filename - Filename for download
   */
  downloadJSON: async (jobId, filename) => {
    const response = await apiClient.get(`/export/job/${jobId}/json`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `results_${jobId}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download Excel export
   * @param {number} jobId - Job ID
   * @param {string} filename - Filename for download
   */
  downloadExcel: async (jobId, filename) => {
    const response = await apiClient.get(`/export/job/${jobId}/excel`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `results_${jobId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download PDF export
   * @param {number} jobId - Job ID
   * @param {string} filename - Filename for download
   */
  downloadPDF: async (jobId, filename) => {
    const response = await apiClient.get(`/export/job/${jobId}/pdf`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `report_${jobId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download Tally-compatible CSV export
   * @param {number} jobId - Job ID
   * @param {string} filename - Filename for download
   */
  downloadTally: async (jobId, filename) => {
    const response = await apiClient.get(`/export/job/${jobId}/tally`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `tally_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download selective CSV export with only selected fields
   * @param {number} jobId - Job ID
   * @param {Array<number>} fieldIds - Array of field IDs to export
   * @param {string} filename - Filename for download
   */
  downloadSelectiveCSV: async (jobId, fieldIds, filename) => {
    const response = await apiClient.post(`/export/job/${jobId}/selective/csv`, {
      field_ids: fieldIds
    }, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `selective_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download selective Tally export with only selected fields
   * @param {number} jobId - Job ID
   * @param {Array<number>} fieldIds - Array of field IDs to export
   * @param {string} filename - Filename for download
   */
  downloadSelectiveTally: async (jobId, fieldIds, filename) => {
    const response = await apiClient.post(`/export/job/${jobId}/selective/tally`, {
      field_ids: fieldIds
    }, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `selective_tally_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const dashboardAPI = {
  /**
   * Get dashboard statistics
   * @returns {Promise} Dashboard stats
   */
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  /**
   * Get dashboard activity
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise} Activity data
   */
  getActivity: async (limit = 10) => {
    const response = await apiClient.get('/dashboard/activity', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Get dashboard summary
   * @returns {Promise} Summary data
   */
  getSummary: async () => {
    const response = await apiClient.get('/dashboard/summary');
    return response.data;
  },
};

// ============================================================================
// VALIDATION API
// ============================================================================

export const validationAPI = {
  /**
   * Validate all fields for a job
   * @param {number} jobId - Job ID
   * @returns {Promise} Validation results
   */
  validateJob: async (jobId) => {
    const response = await apiClient.get(`/validation/job/${jobId}`);
    return response.data;
  },

  /**
   * Validate a single field
   * @param {number} fieldId - Field ID
   * @returns {Promise} Validation result
   */
  validateField: async (fieldId) => {
    const response = await apiClient.get(`/validation/field/${fieldId}`);
    return response.data;
  },
};

// ============================================================================
// ACCOUNTING EXPORT API
// ============================================================================

export const accountingExportAPI = {
  /**
   * Get list of supported accounting software
   * @returns {Promise} List of supported software
   */
  getSupportedSoftware: async () => {
    const response = await apiClient.get('/accounting-export/supported-software');
    return response.data;
  },

  /**
   * Get configuration schema for a software
   * @param {string} software - Software ID (e.g., 'tally')
   * @returns {Promise} Configuration schema and defaults
   */
  getConfigSchema: async (software) => {
    const response = await apiClient.get(`/accounting-export/${software}/config`);
    return response.data;
  },

  /**
   * Validate job data for accounting export
   * @param {number} jobId - Job ID
   * @param {string} software - Software ID
   * @returns {Promise} Validation results
   */
  validateData: async (jobId, software) => {
    const response = await apiClient.post('/accounting-export/validate', {
      job_id: jobId,
      software: software
    });
    return response.data;
  },

  /**
   * Preview accounting export
   * @param {number} jobId - Job ID
   * @param {string} software - Software ID
   * @param {Object} config - Configuration
   * @param {number} limit - Number of items to preview
   * @returns {Promise} Preview data
   */
  previewExport: async (jobId, software, config, limit = 5) => {
    const response = await apiClient.post('/accounting-export/preview', {
      job_id: jobId,
      software: software,
      config: config,
      limit: limit
    });
    return response.data;
  },

  /**
   * Generate and download accounting export file
   * @param {number} jobId - Job ID
   * @param {string} software - Software ID
   * @param {Object} config - Configuration
   * @param {string} filename - Custom filename (optional)
   * @returns {Promise} Download initiated
   */
  generateExport: async (jobId, software, config, filename) => {
    const response = await apiClient.post('/accounting-export/generate', {
      job_id: jobId,
      software: software,
      config: config
    }, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `${software}_export_${jobId}.xml`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },

  /**
   * Save accounting export configuration
   * @param {string} software - Software ID
   * @param {Object} config - Configuration to save
   * @param {string} name - Configuration name
   * @param {boolean} isDefault - Set as default
   * @returns {Promise} Saved configuration
   */
  saveConfig: async (software, config, name = 'Default', isDefault = false) => {
    const response = await apiClient.post('/accounting-export/config/save', {
      software,
      config,
      name,
      is_default: isDefault
    });
    return response.data;
  },

  /**
   * Get saved configurations for a software
   * @param {string} software - Software ID
   * @returns {Promise} List of saved configurations
   */
  getSavedConfigs: async (software) => {
    const response = await apiClient.get(`/accounting-export/config/${software}`);
    return response.data;
  },

  /**
   * Delete a saved configuration
   * @param {number} configId - Configuration ID
   * @returns {Promise} Success message
   */
  deleteConfig: async (configId) => {
    const response = await apiClient.delete(`/accounting-export/config/${configId}`);
    return response.data;
  },

  /**
   * Batch export multiple jobs
   * @param {Array<number>} jobIds - Array of job IDs
   * @param {string} software - Software ID
   * @param {Object} config - Configuration
   * @returns {Promise} Download initiated
   */
  batchExport: async (jobIds, software, config) => {
    const response = await apiClient.post('/accounting-export/batch-generate', {
      job_ids: jobIds,
      software: software,
      config: config
    }, {
      responseType: 'blob'
    });

    // Create download link
    const jobIdsStr = jobIds.slice(0, 3).join('_');
    const suffix = jobIds.length > 3 ? `_plus${jobIds.length - 3}` : '';
    const filename = `${software}_batch_${jobIdsStr}${suffix}.xml`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },

  /**
   * Get export history
   * @param {string} software - Optional software filter
   * @param {number} limit - Maximum records to return
   * @returns {Promise} Export history
   */
  getExportHistory: async (software = null, limit = 50) => {
    const params = { limit };
    if (software) params.software = software;

    const response = await apiClient.get('/accounting-export/history', { params });
    return response.data;
  },
};

// ============================================================================
// CUSTOM FIELDS API
// ============================================================================

export const customFieldsAPI = {
  /**
   * Create a new custom field for a job
   * @param {number} jobId - Job ID
   * @param {Object} customField - { field_name, field_value, field_type }
   * @returns {Promise} Created custom field
   */
  create: async (jobId, customField) => {
    const response = await apiClient.post(`/custom-fields/job/${jobId}`, customField);
    return response.data;
  },

  /**
   * Get all custom fields for a job
   * @param {number} jobId - Job ID
   * @returns {Promise} List of custom fields
   */
  getByJobId: async (jobId) => {
    const response = await apiClient.get(`/custom-fields/job/${jobId}`);
    return response.data;
  },

  /**
   * Update a custom field
   * @param {number} fieldId - Custom field ID
   * @param {Object} updates - { field_name, field_value, field_type }
   * @returns {Promise} Updated custom field
   */
  update: async (fieldId, updates) => {
    const response = await apiClient.patch(`/custom-fields/${fieldId}`, updates);
    return response.data;
  },

  /**
   * Delete a custom field
   * @param {number} fieldId - Custom field ID
   * @returns {Promise} Success message
   */
  delete: async (fieldId) => {
    await apiClient.delete(`/custom-fields/${fieldId}`);
  },
};

// ============================================================================
// TICKETS API
// ============================================================================

export const ticketsAPI = {
  /**
   * Create a new support ticket
   * @param {FormData} formData - Form data with ticket_type, subject, description, priority, logs, file
   * @returns {Promise} Created ticket
   */
  create: async (formData) => {
    const response = await apiClient.post('/tickets/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all tickets for current user
   * @param {string} statusFilter - Optional status filter
   * @returns {Promise} List of tickets
   */
  getAll: async (statusFilter = null) => {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    const response = await apiClient.get('/tickets/', { params });
    return response.data;
  },

  /**
   * Get a specific ticket by ID
   * @param {number} ticketId - Ticket ID
   * @returns {Promise} Ticket details
   */
  getById: async (ticketId) => {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return response.data;
  },

  /**
   * Update a ticket
   * @param {number} ticketId - Ticket ID
   * @param {Object} updates - { status, priority, admin_notes }
   * @returns {Promise} Updated ticket
   */
  update: async (ticketId, updates) => {
    const response = await apiClient.patch(`/tickets/${ticketId}`, updates);
    return response.data;
  },

  /**
   * Delete a ticket
   * @param {number} ticketId - Ticket ID
   * @returns {Promise} Success message
   */
  delete: async (ticketId) => {
    await apiClient.delete(`/tickets/${ticketId}`);
  },
};

// ============================================================================
// HEALTH API
// ============================================================================

export const healthAPI = {
  /**
   * Check API health
   * @returns {Promise} Health status
   */
  check: async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  },
};

// Export the configured axios instance for custom requests
export default apiClient;
