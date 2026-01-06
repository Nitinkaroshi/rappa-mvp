import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { uploadAPI, templatesAPI } from '../services/api';
import { Upload as UploadIcon, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Category definitions
  const categories = [
    { id: 'real_estate', name: '🏠 Real Estate Documents', icon: '🏠' },
    { id: 'banking', name: '🏦 Banking Documents', icon: '🏦' },
    { id: 'finance', name: '💰 Finance Documents', icon: '💰' },
    { id: 'personal', name: '👤 Personal Documents', icon: '👤' }
  ];

  // Get templates for selected category
  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : [];

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await templatesAPI.getAll();
        setTemplates(data);

        // Pre-select template from URL query parameter
        const templateParam = searchParams.get('template');
        if (templateParam) {
          setSelectedTemplate(templateParam);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    }
    loadTemplates();
  }, [searchParams]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setSuccess(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    setSuccess(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Only append template_id if one is selected
      // If not selected, Gemini AI will auto-detect the document type
      if (selectedTemplate) {
        formData.append('template_id', selectedTemplate);
      }

      const result = await uploadAPI.uploadDocument(formData, setProgress);
      setSuccess(true);
      setProgress(100);

      // Navigate to dashboard with auto-scroll to the new job
      // The dashboard has real-time updates, so user will see processing status
      setTimeout(() => {
        navigate('/dashboard', { state: { newJobId: result.job_id } });
      }, 1500);
    } catch (err) {
      setProgress(0);

      // Extract detailed error message
      let errorMessage = 'Upload failed. Please try again.';

      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.response?.status === 402) {
        errorMessage = 'Insufficient credits. Please add more credits to continue.';
      } else if (err.response?.status === 413) {
        errorMessage = 'File is too large. Maximum size is 50 MB.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.detail || 'Invalid file. Please check the file type and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Header */}
      <nav className="bg-white shadow-lg border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all">rappa.ai</Link>
          <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-200 hover:shadow-3xl transition-shadow duration-300">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">Upload Document</h1>
            <p className="text-gray-600 text-lg">
              Upload your documents for AI-powered OCR and data extraction. Supports PDF (multi-page), JPG, and PNG formats up to 50 MB.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-5 flex items-start gap-3 shadow-md">
              <AlertCircle size={22} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-900">Upload Failed</h3>
                <p className="text-sm text-red-700 mt-1 font-medium">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-1 transition-colors">
                <X size={18} />
              </button>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 flex items-start gap-3 shadow-md">
              <CheckCircle size={22} className="text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-green-900">Upload Successful!</h3>
                <p className="text-sm text-green-700 mt-1 font-medium">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6">
            {/* File Upload Area */}
            {!file ? (
              <div className="border-3 border-dashed border-gray-300 rounded-2xl p-16 text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all duration-300 bg-gradient-to-br from-gray-50 to-indigo-50/20">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="bg-indigo-100 p-4 rounded-full w-20 h-20 mx-auto mb-5 flex items-center justify-center">
                    <UploadIcon size={40} className="text-indigo-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-800 mb-2">
                    Click to select a file
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    Supported formats: PDF, JPG, PNG (Max 50 MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border-2 border-indigo-400 rounded-xl p-6 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText size={40} className="text-indigo-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-gray-500 hover:text-red-600 transition"
                    >
                      <X size={24} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Document Type Selection - Two Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Document Type <span className="text-gray-400">(Optional)</span>
                </label>
                {(selectedCategory || selectedTemplate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedTemplate('');
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Use Auto-Detect Instead
                  </button>
                )}
              </div>

              {/* Auto-detect option or Category selection */}
              {!selectedCategory && !selectedTemplate && (
                <div className="space-y-3">
                  {/* Auto-detect card */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedTemplate('');
                    }}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      !selectedTemplate && !selectedCategory
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🤖</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Auto-Detect (Recommended)</div>
                        <div className="text-sm text-gray-600">AI will automatically detect document type and extract fields</div>
                      </div>
                      {!selectedTemplate && !selectedCategory && (
                        <div className="text-green-600 font-semibold">✓ Selected</div>
                      )}
                    </div>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-gray-50 text-gray-500">OR</span>
                    </div>
                  </div>

                  <div className="text-sm font-medium text-gray-700 mb-2">Select Document Category:</div>

                  {/* Category cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSelectedTemplate('');
                        }}
                        className="p-4 border-2 border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left"
                      >
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <div className="font-medium text-gray-900 text-sm">{category.name.replace(/^.{2}\s/, '')}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {templates.filter(t => t.category === category.id).length} templates
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Template selection for chosen category */}
              {selectedCategory && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('')}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ← Back to categories
                    </button>
                  </div>

                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Select {categories.find(c => c.id === selectedCategory)?.name}:
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedTemplate === template.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className={`text-sm mt-1 ${
                              selectedTemplate === template.id ? 'text-indigo-100' : 'text-gray-600'
                            }`}>
                              {template.description}
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No templates available in this category
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status message */}
              {selectedTemplate ? (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircle size={16} />
                  <span className="font-medium">
                    Using template-based extraction for higher accuracy
                  </span>
                </div>
              ) : !selectedCategory && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <AlertCircle size={16} />
                  <span className="font-medium">
                    AI will automatically detect document type and extract fields
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* File Specifications & Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  File Requirements
                </h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div>
                    <p className="font-medium">Accepted Formats:</p>
                    <p className="text-blue-600">PDF, JPG, JPEG, PNG</p>
                  </div>
                  <div>
                    <p className="font-medium">Maximum File Size:</p>
                    <p className="text-blue-600">50 MB per file</p>
                  </div>
                  <div>
                    <p className="font-medium">Image Quality:</p>
                    <p className="text-blue-600">300+ DPI recommended for best results</p>
                  </div>
                </div>
              </div>

              {/* Credit Pricing */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Credit Pricing
                </h3>
                <div className="space-y-2 text-sm text-green-700">
                  <div>
                    <p className="font-medium">Images (JPG, PNG):</p>
                    <p className="text-green-600">1 credit per image</p>
                  </div>
                  <div>
                    <p className="font-medium">PDF Documents:</p>
                    <p className="text-green-600">1 credit per page</p>
                  </div>
                  <div className="text-xs text-green-600 bg-green-100 rounded px-2 py-1 mt-2">
                    Example: A 5-page PDF costs 5 credits
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Method Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">Two-Way Document Processing</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• <strong>Way 1 (Template-based):</strong> Select document type for higher accuracy with predefined fields</li>
                <li>• <strong>Way 2 (AI Auto-detect):</strong> Let Gemini AI automatically detect document type and extract relevant fields</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!file || uploading || success}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : success ? 'Upload Complete!' : 'Upload Document'}
              </button>
              <Link
                to="/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
