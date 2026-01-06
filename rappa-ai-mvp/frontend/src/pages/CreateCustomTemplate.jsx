import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Wand2, Save, Trash2, GripVertical, Plus, X } from 'lucide-react';
import { authAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with credentials for cookie-based auth
const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // Send cookies automatically
  timeout: 30000,
});

function CreateCustomTemplate() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [sampleFile, setSampleFile] = useState(null);
  const [sampleFilePreview, setSampleFilePreview] = useState(null);
  const [schema, setSchema] = useState([]);
  const [userInstructions, setUserInstructions] = useState('');

  // UI state
  const [generatingSchema, setGeneratingSchema] = useState(false);
  const [validatingSchema, setValidatingSchema] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schemaGenerated, setSchemaGenerated] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const userData = await authAPI.me();
        setUser(userData);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
      }
    }
    load();
  }, [navigate]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or PDF file');
      return;
    }

    setSampleFile(file);
    setSchemaGenerated(false);
    setValidationResult(null);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSampleFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSampleFilePreview(null);
    }
  };

  const handleGenerateSchema = async () => {
    if (!sampleFile) {
      alert('Please upload a sample document first');
      return;
    }

    if (!documentType.trim()) {
      alert('Please enter a document type');
      return;
    }

    setGeneratingSchema(true);

    try {
      const formData = new FormData();
      formData.append('file', sampleFile);
      formData.append('document_type', documentType);
      if (userInstructions.trim()) {
        formData.append('user_instructions', userInstructions);
      }

      const response = await apiClient.post(
        '/custom-templates/generate-schema',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSchema(response.data.schema);
      setSchemaGenerated(true);
    } catch (error) {
      console.error('Schema generation failed:', error);
      alert(error.response?.data?.detail || 'Failed to generate schema');
    } finally {
      setGeneratingSchema(false);
    }
  };

  const handleValidateSchema = async () => {
    if (!sampleFile || schema.length === 0) {
      alert('Please generate a schema first');
      return;
    }

    setValidatingSchema(true);

    try {
      const formData = new FormData();
      formData.append('file', sampleFile);
      formData.append('schema', JSON.stringify(schema));

      const response = await apiClient.post(
        '/custom-templates/validate-schema',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setValidationResult(response.data);
    } catch (error) {
      console.error('Schema validation failed:', error);
      console.error('Error details:', error.response?.data);
      console.error('Full error response:', error.response);

      // Show detailed error message - handle both FastAPI error formats
      let errorMsg = 'Failed to validate schema';
      if (error.response?.data) {
        // FastAPI 422 validation errors
        if (error.response.data.detail) {
          errorMsg = JSON.stringify(error.response.data.detail, null, 2);
        } else if (error.response.data.error) {
          errorMsg = JSON.stringify(error.response.data.error, null, 2);
        } else {
          errorMsg = JSON.stringify(error.response.data, null, 2);
        }
      }
      alert(`Validation Error:\n${errorMsg}`);
    } finally {
      setValidatingSchema(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(schema);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSchema(items);
    setValidationResult(null); // Clear validation when schema changes
  };

  const handleFieldChange = (index, field, value) => {
    const newSchema = [...schema];
    newSchema[index][field] = value;
    setSchema(newSchema);
    setValidationResult(null);
  };

  const handleRemoveField = (index) => {
    const newSchema = schema.filter((_, i) => i !== index);
    setSchema(newSchema);
    setValidationResult(null);
  };

  const handleAddField = () => {
    setSchema([
      ...schema,
      {
        name: '',
        label: '',
        type: 'text',
        required: false,
        description: ''
      }
    ]);
  };

  const handleSaveTemplate = async () => {
    // Validation
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (!documentType.trim()) {
      alert('Please enter a document type');
      return;
    }

    if (schema.length === 0) {
      alert('Please generate or add fields to the schema');
      return;
    }

    // Validate all fields have names and labels
    for (const field of schema) {
      if (!field.name.trim() || !field.label.trim()) {
        alert('All fields must have a name and label');
        return;
      }
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('document_type', documentType);
      if (description.trim()) {
        formData.append('description', description);
      }
      formData.append('schema', JSON.stringify(schema));
      if (sampleFile) {
        formData.append('sample_image', sampleFile);
      }

      await apiClient.post('/custom-templates', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/custom-templates');
    } catch (error) {
      console.error('Failed to save template:', error);
      alert(error.response?.data?.detail || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
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
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/custom-templates')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Custom Template</h1>
                <p className="text-gray-600 mt-1">
                  Upload a sample document and let AI suggest fields to extract
                </p>
              </div>
            </div>

            {/* Step 1: Basic Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Template Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Property Sale Deed Template"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type *
                  </label>
                  <input
                    type="text"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    placeholder="e.g., Sale Deed, Invoice, Receipt"
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
                    placeholder="Describe what this template is for..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Upload Sample */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Upload Sample Document</h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {sampleFilePreview ? (
                  <div className="space-y-4">
                    <img
                      src={sampleFilePreview}
                      alt="Sample preview"
                      className="max-h-64 mx-auto rounded-lg border border-gray-200"
                    />
                    <div className="text-sm text-gray-600">{sampleFile.name}</div>
                    <button
                      onClick={() => {
                        setSampleFile(null);
                        setSampleFilePreview(null);
                        setSchemaGenerated(false);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove File
                    </button>
                  </div>
                ) : sampleFile ? (
                  <div className="space-y-4">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="text-sm text-gray-600">{sampleFile.name}</div>
                    <button
                      onClick={() => {
                        setSampleFile(null);
                        setSchemaGenerated(false);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Upload a sample document</p>
                    <p className="text-sm text-gray-500 mb-4">JPG, PNG, or PDF (max 50MB)</p>
                    <label className="cursor-pointer inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      Choose File
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>

              {sampleFile && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Instructions for AI (Optional)
                  </label>
                  <textarea
                    value={userInstructions}
                    onChange={(e) => setUserInstructions(e.target.value)}
                    placeholder="e.g., Focus on extracting financial details, Include regional language fields..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Step 3: Generate Schema */}
            {sampleFile && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Generate Schema</h2>

                {!schemaGenerated ? (
                  <button
                    onClick={handleGenerateSchema}
                    disabled={generatingSchema}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wand2 size={20} />
                    {generatingSchema ? 'Generating...' : 'Generate Schema with AI'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-green-600 font-medium">
                        ✓ Schema generated with {schema.length} fields
                      </p>
                      <button
                        onClick={handleGenerateSchema}
                        disabled={generatingSchema}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        Regenerate
                      </button>
                    </div>

                    {/* Schema Table - Excel-like view */}
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Field Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Label
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Required
                            </th>
                            <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {schema.map((field, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {index + 1}
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={field.name}
                                  onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="field_name"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Display Label"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <select
                                  value={field.type}
                                  onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                  <option value="text">Text</option>
                                  <option value="number">Number</option>
                                  <option value="date">Date</option>
                                  <option value="email">Email</option>
                                  <option value="phone">Phone</option>
                                  <option value="currency">Currency</option>
                                  <option value="boolean">Boolean</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleRemoveField(index)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  title="Delete field"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={handleAddField}
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                      <Plus size={16} />
                      Add Custom Field
                    </button>

                    {/* Validation */}
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleValidateSchema}
                        disabled={validatingSchema}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {validatingSchema ? 'Validating...' : 'Validate Schema'}
                      </button>

                      {validationResult && (
                        <div className={`mt-4 p-4 rounded-lg ${validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                          <div className="font-medium mb-2">
                            {validationResult.valid ? '✓ Schema is valid' : '⚠ Schema validation warning'}
                          </div>
                          <div className="text-sm text-gray-700">
                            Coverage: {validationResult.coverage}% of fields found in document
                          </div>
                          {validationResult.warnings && validationResult.warnings.length > 0 && (
                            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                              {validationResult.warnings.map((warning, i) => (
                                <li key={i}>{warning}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {schemaGenerated && schema.length > 0 && (
              <div className="flex justify-end gap-3 pb-6">
                <button
                  onClick={() => navigate('/custom-templates')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save size={20} />
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CreateCustomTemplate;
