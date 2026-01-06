import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Send, Layers } from 'lucide-react';
import { authAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function CreateBatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  // Data
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);

  // UI state
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const userData = await authAPI.me();
        setUser(userData);
        await loadTemplates();
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
      }
    }
    load();
  }, [navigate]);

  useEffect(() => {
    // Auto-select template from query params
    const templateId = searchParams.get('template');
    if (templateId && templates.length > 0) {
      const id = parseInt(templateId);
      setSelectedTemplateId(id);
      const template = templates.find(t => t.id === id);
      setSelectedTemplate(template);
    }
  }, [searchParams, templates]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/api/v1/custom-templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);
  };

  const handleFilesSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const invalidFiles = selectedFiles.filter(f => !allowedTypes.includes(f.type));

    if (invalidFiles.length > 0) {
      alert('Some files have invalid types. Only JPG, PNG, and PDF are allowed.');
      return;
    }

    // Check total count
    if (files.length + selectedFiles.length > 100) {
      alert('Maximum 100 documents per batch');
      return;
    }

    setFiles([...files, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedTemplateId) {
      alert('Please select a template');
      return;
    }

    if (!name.trim()) {
      alert('Please enter a batch name');
      return;
    }

    if (files.length === 0) {
      alert('Please upload at least one document');
      return;
    }

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append('custom_template_id', selectedTemplateId);
      formData.append('name', name);
      if (description.trim()) {
        formData.append('description', description);
      }

      // Add all files
      files.forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('access_token');
      await axios.post(`${API_URL}/api/v1/batches`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/batches');
    } catch (error) {
      console.error('Failed to create batch:', error);
      alert(error.response?.data?.detail || 'Failed to create batch');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader user={user} />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/batches')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Batch</h1>
                <p className="text-gray-600 mt-1">
                  Process multiple documents using a custom template
                </p>
              </div>
            </div>

            {/* Step 1: Select Template */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Select Template</h2>

              {loadingTemplates ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-4">No templates available</p>
                  <button
                    onClick={() => navigate('/custom-templates/create')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Create a template first
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`text-left p-4 border-2 rounded-lg transition-all ${
                        selectedTemplateId === template.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedTemplateId === template.id ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}>
                          <Layers className={selectedTemplateId === template.id ? 'text-indigo-600' : 'text-gray-600'} size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.document_type}</p>
                          <p className="text-xs text-gray-500 mt-2">{template.field_count} fields</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedTemplate && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Template Fields:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.schema.map((field, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                        {field.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Batch Info */}
            {selectedTemplateId && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Batch Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Property Deeds Batch 1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this batch..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Upload Documents */}
            {selectedTemplateId && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Upload Documents</h2>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Upload documents to process</p>
                  <p className="text-sm text-gray-500 mb-4">
                    JPG, PNG, or PDF (max 100 documents)
                  </p>
                  <label className="cursor-pointer inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Choose Files
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      multiple
                      onChange={handleFilesSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Files List */}
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {files.length} document{files.length !== 1 ? 's' : ''} selected
                      </h3>
                      <button
                        onClick={() => setFiles([])}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-3">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(idx)}
                            className="ml-3 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info & Submit */}
            {selectedTemplateId && files.length > 0 && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• All {files.length} documents will be processed using the selected template</li>
                    <li>• AI will extract data based on the template schema</li>
                    <li>• Results will be available for download in CSV or Excel format</li>
                    <li>• Batch data will be automatically deleted after 30 days</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pb-6">
                  <button
                    onClick={() => navigate('/batches')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={processing}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <Send size={20} />
                    {processing ? 'Processing...' : 'Process Batch'}
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CreateBatch;
