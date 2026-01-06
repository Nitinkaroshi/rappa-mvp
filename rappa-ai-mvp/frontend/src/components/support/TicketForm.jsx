import { useState } from 'react';
import { ticketsAPI } from '../../services/api';

export default function TicketForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    ticket_type: 'help',
    subject: '',
    description: '',
    priority: 'medium',
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const ticketTypes = [
    { value: 'bug', label: 'Bug Report', icon: '🐛', description: 'Report a bug or technical issue' },
    { value: 'feature_request', label: 'Feature Request', icon: '💡', description: 'Suggest a new feature' },
    { value: 'help', label: 'Help & Support', icon: '❓', description: 'Get help using the platform' },
    { value: 'billing', label: 'Billing', icon: '💳', description: 'Questions about billing or credits' },
    { value: 'other', label: 'Other', icon: '📝', description: 'Other inquiries' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        e.target.value = null;
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const collectBrowserLogs = () => {
    // Collect browser and system information
    const logs = {
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
      },
      location: {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
      },
      timestamp: new Date().toISOString(),
    };

    // Try to get recent console errors (if available)
    // Note: This is limited by browser security, but we can at least capture the structure
    try {
      logs.performance = {
        memory: window.performance.memory
          ? {
              usedJSHeapSize: window.performance.memory.usedJSHeapSize,
              totalJSHeapSize: window.performance.memory.totalJSHeapSize,
            }
          : null,
      };
    } catch (err) {
      // Performance memory not available in all browsers
    }

    return logs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.subject.trim() || formData.subject.length < 5) {
      setError('Subject must be at least 5 characters');
      return;
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data submission
      const submitData = new FormData();
      submitData.append('ticket_type', formData.ticket_type);
      submitData.append('subject', formData.subject.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('priority', formData.priority);

      // Collect and attach browser logs
      const logs = collectBrowserLogs();
      submitData.append('logs', JSON.stringify(logs));

      // Attach file if selected
      if (file) {
        submitData.append('file', file);
      }

      // Submit ticket
      const ticket = await ticketsAPI.create(submitData);

      // Reset form
      setFormData({
        ticket_type: 'help',
        subject: '',
        description: '',
        priority: 'medium',
      });
      setFile(null);

      // Call success callback
      if (onSuccess) {
        onSuccess(ticket);
      }
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      setError(err.response?.data?.detail || 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Ticket Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What can we help you with?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ticketTypes.map((type) => (
            <label
              key={type.value}
              className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.ticket_type === type.value
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="ticket_type"
                value={type.value}
                checked={formData.ticket_type === type.value}
                onChange={handleChange}
                className="sr-only"
              />
              <div className="flex items-start w-full">
                <span className="text-2xl mr-3">{type.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Brief description of your issue or question"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
          minLength={5}
          maxLength={200}
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.subject.length}/200 characters
        </p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Please provide detailed information about your issue or question..."
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          required
          minLength={10}
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.description.length} characters (minimum 10)
        </p>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <div className="flex gap-3">
          {priorities.map((priority) => (
            <label
              key={priority.value}
              className={`flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                formData.priority === priority.value
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="priority"
                value={priority.value}
                checked={formData.priority === priority.value}
                onChange={handleChange}
                className="sr-only"
              />
              <span className={`font-medium ${priority.color}`}>{priority.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* File Attachment */}
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
          Attach File (Optional)
        </label>
        <div className="mt-1">
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt,.log"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100 cursor-pointer"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Screenshots, documents, or logs (Max 10MB)
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3 text-sm text-blue-700">
            <p className="font-medium">Automatic Log Collection</p>
            <p className="mt-1">
              Browser and system information will be automatically included to help us diagnose
              your issue faster.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </div>
    </form>
  );
}
