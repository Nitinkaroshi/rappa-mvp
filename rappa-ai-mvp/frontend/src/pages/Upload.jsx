import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadAPI, templatesAPI } from '../services/api';
import { authAPI } from '../services/api';
import { Upload as UploadIcon, FileText, X, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { Card, Button, Badge } from '../components/ui';

export default function Upload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

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
    { id: 'real_estate', name: 'Real Estate Documents', icon: '🏠' },
    { id: 'banking', name: 'Banking Documents', icon: '🏦' },
    { id: 'finance', name: 'Finance Documents', icon: '💰' },
    { id: 'personal', name: 'Personal Documents', icon: '👤' }
  ];

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : [];

  useEffect(() => {
    async function init() {
      try {
        const userData = await authAPI.me();
        setUser(userData);
        const templateData = await templatesAPI.getAll();
        setTemplates(templateData);

        const templateParam = searchParams.get('template');
        if (templateParam) {
          setSelectedTemplate(templateParam);
        }
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
        console.error('Failed to load data:', error);
      }
    }
    init();
  }, [navigate, searchParams]);

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

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

      if (selectedTemplate) {
        formData.append('template_id', selectedTemplate);
      }

      const result = await uploadAPI.uploadDocument(formData, setProgress);
      setSuccess(true);
      setProgress(100);

      setTimeout(() => {
        navigate('/dashboard', { state: { newJobId: result.job_id } });
      }, 1500);
    } catch (err) {
      setProgress(0);
      let errorMessage = 'Upload failed. Please try again.';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
        activePath="/upload"
      />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader user={user} onLogout={handleLogout} title="Upload Document" />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto animate-fade-in-up">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload Document</h1>
                    <p className="text-gray-600">
                      Upload your documents for AI-powered OCR and data extraction
                    </p>
                  </div>
                  <Badge variant="info" size="md">
                    Max 50 MB
                  </Badge>
                </div>
              </Card.Header>

              <Card.Body>
                {/* Error Alert */}
                {error && (
                  <div className="mb-6 bg-error-50 border border-error-200 rounded-lg p-4 flex items-start gap-3 animate-slide-in-down">
                    <AlertCircle size={20} className="text-error-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-error-900">Upload Failed</h3>
                      <p className="text-sm text-error-700 mt-1">{error}</p>
                    </div>
                    <button onClick={() => setError('')} className="text-error-600 hover:text-error-800 hover:bg-error-100 rounded-lg p-1 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                )}

                {/* Success Alert */}
                {success && (
                  <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4 flex items-start gap-3 animate-bounce-in">
                    <CheckCircle size={20} className="text-success-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-success-900">Upload Successful!</h3>
                      <p className="text-sm text-success-700 mt-1">Redirecting to dashboard...</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleUpload} className="space-y-6">
                  {/* File Upload Area */}
                  {!file ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-300 bg-gray-50/50 cursor-pointer group">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                        disabled={uploading}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="w-16 h-16 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UploadIcon size={32} className="text-primary-600" />
                        </div>
                        <p className="text-xl font-bold text-gray-900 mb-2">
                          Click to select a file
                        </p>
                        <p className="text-sm text-gray-500">
                          Supported formats: PDF, JPG, PNG
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="border border-primary-200 rounded-xl p-5 bg-primary-50/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FileText size={24} className="text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        {!uploading && (
                          <button
                            type="button"
                            onClick={removeFile}
                            className="text-gray-400 hover:text-error-600 hover:bg-error-50 p-2 rounded-lg transition-colors"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Document Type Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-900">
                        Document Type <Badge variant="neutral" size="sm" className="ml-2">Optional</Badge>
                      </label>
                      {(selectedCategory || selectedTemplate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('');
                            setSelectedTemplate('');
                          }}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
                        >
                          Use Auto-Detect Instead
                        </button>
                      )}
                    </div>

                    {!selectedCategory && !selectedTemplate && (
                      <div className="space-y-4">
                        {/* Auto-detect card */}
                        <div className={`p-4 border-2 rounded-xl transition-all ${!selectedTemplate && !selectedCategory
                          ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                          : 'border-gray-200 bg-white'
                          }`}>
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">🤖</div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-900">Auto-Detect (Recommended)</div>
                              <div className="text-sm text-gray-600">AI will automatically detect document type and extract fields</div>
                            </div>
                            {!selectedTemplate && !selectedCategory && (
                              <Badge variant="success" size="sm">Selected</Badge>
                            )}
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500 font-medium">OR Select Category</span>
                          </div>
                        </div>

                        {/* Category cards */}
                        <div className="grid grid-cols-2 gap-4">
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(category.id);
                                setSelectedTemplate('');
                              }}
                              className="p-4 border border-gray-200 rounded-xl hover:border-primary-500 hover:ring-1 hover:ring-primary-500 hover:bg-primary-50/30 transition-all text-left group"
                            >
                              <div className="text-2xl mb-2">{category.icon}</div>
                              <div className="font-bold text-gray-900 text-sm group-hover:text-primary-700">{category.name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {templates.filter(t => t.category === category.id).length} templates
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Template selection */}
                    {selectedCategory && (
                      <div className="space-y-4 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('')}
                          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium transition-colors"
                        >
                          <ArrowLeft size={16} /> Back to categories
                        </button>

                        <div className="text-sm font-bold text-gray-900">
                          Select {categories.find(c => c.id === selectedCategory)?.name}:
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-2 bg-gray-50/50">
                          {filteredTemplates.length > 0 ? (
                            filteredTemplates.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`w-full text-left p-3 rounded-lg transition-all ${selectedTemplate === template.id
                                  ? 'bg-primary-600 text-white shadow-md'
                                  : 'bg-white hover:bg-gray-100 text-gray-900'
                                  }`}
                              >
                                <div className="font-bold text-sm">{template.name}</div>
                                {template.description && (
                                  <div className={`text-xs mt-1 ${selectedTemplate === template.id ? 'text-primary-100' : 'text-gray-500'
                                    }`}>
                                    {template.description}
                                  </div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                              No templates available in this category
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {uploading && (
                    <div className="space-y-2 animate-fade-in">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span className="font-medium">Uploading...</span>
                        <span className="font-bold">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card hover={false} className="border-info-200 bg-info-50">
                      <Card.Body className="p-4">
                        <h3 className="text-sm font-bold text-info-900 mb-2 flex items-center gap-2">
                          <FileText size={16} /> File Requirements
                        </h3>
                        <div className="space-y-1 text-xs text-info-800">
                          <p>• PDF, JPG, JPEG, PNG</p>
                          <p>• Max 50 MB per file</p>
                          <p>• 300+ DPI recommended</p>
                        </div>
                      </Card.Body>
                    </Card>

                    <Card hover={false} className="border-success-200 bg-success-50">
                      <Card.Body className="p-4">
                        <h3 className="text-sm font-bold text-success-900 mb-2 flex items-center gap-2">
                          Credit Pricing
                        </h3>
                        <div className="space-y-1 text-xs text-success-800">
                          <p>• 1 credit per image</p>
                          <p>• 1 credit per PDF page</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={!file || uploading || success}
                      loading={uploading}
                      className="flex-1"
                    >
                      {uploading ? 'Processing...' : success ? 'Upload Complete!' : 'Upload Document'}
                    </Button>
                    <Button variant="ghost" size="lg" onClick={() => navigate('/dashboard')}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
