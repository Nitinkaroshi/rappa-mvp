import { useState, useEffect } from 'react';
import { fieldsAPI, templatesAPI, exportAPI, customFieldsAPI } from '../../services/api';
import { Save, RotateCcw, Download, Edit2, Check, X, Plus, Trash2 } from 'lucide-react';
import toast from '../../utils/toast.jsx';

export default function FieldsEditor({ jobId, templateId, onSave }) {
  const [fields, setFields] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [pendingCustomFields, setPendingCustomFields] = useState([]);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAddingCustomField, setIsAddingCustomField] = useState(false);
  const [newCustomField, setNewCustomField] = useState({
    field_name: '',
    field_value: '',
    field_type: 'text'
  });

  useEffect(() => {
    loadData();
  }, [jobId, templateId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templateData, fieldsData, customFieldsData] = await Promise.all([
        templateId ? templatesAPI.getById(templateId) : Promise.resolve(null),
        fieldsAPI.getJobFields(jobId),
        customFieldsAPI.getByJobId(jobId).catch(() => [])
      ]);
      setTemplate(templateData);
      setFields(fieldsData);
      setCustomFields(customFieldsData);
      setPendingCustomFields([]);
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId, newValue) => {
    setFields(fields.map(f =>
      f.id === fieldId
        ? { ...f, current_value: newValue, is_edited: true }
        : f
    ));
    setHasChanges(true);
  };

  const startEditing = (fieldId) => {
    setEditingFieldId(fieldId);
  };

  const cancelEditing = () => {
    setEditingFieldId(null);
    loadData(); // Reload to reset changes
  };

  const saveField = async (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field || !field.is_edited) return;

    try {
      await fieldsAPI.updateField(fieldId, field.current_value);
      setEditingFieldId(null);
      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error('Error saving field:', error);
      alert('Failed to save field');
    }
  };

  // Custom Fields Functions
  const handleAddCustomField = () => {
    if (!newCustomField.field_name.trim()) {
      toast.error('Field name is required');
      return;
    }

    // Add to pending list (not saved to DB yet)
    setPendingCustomFields([...pendingCustomFields, {
      ...newCustomField,
      id: `temp_${Date.now()}`, // Temporary ID
      isNew: true
    }]);

    // Reset form
    setNewCustomField({ field_name: '', field_value: '', field_type: 'text' });
    setIsAddingCustomField(false);
    setHasChanges(true);
  };

  const handleRemovePendingCustomField = (tempId) => {
    setPendingCustomFields(pendingCustomFields.filter(f => f.id !== tempId));
    setHasChanges(pendingCustomFields.length > 1 || fields.some(f => f.is_edited));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const toastId = toast.loading('Saving changes...');

    try {
      // Save extracted field updates
      const fieldUpdates = fields
        .filter(f => f.is_edited)
        .map(f => ({ field_id: f.id, edited_value: f.current_value }));

      if (fieldUpdates.length > 0) {
        await fieldsAPI.batchUpdate(jobId, fieldUpdates);
      }

      // Save new custom fields
      for (const customField of pendingCustomFields) {
        await customFieldsAPI.create(jobId, {
          field_name: customField.field_name,
          field_value: customField.field_value,
          field_type: customField.field_type
        });
      }

      setHasChanges(false);
      setPendingCustomFields([]);
      onSave?.();
      await loadData(); // Reload to get saved custom fields
      toast.success('All changes saved successfully!', { id: toastId });
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes. Please try again.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (fieldId) => {
    // Show confirmation toast with action
    toast.withAction(
      'Reset this field to its original value?',
      'Reset',
      async () => {
        const toastId = toast.loading('Resetting field...');
        try {
          await fieldsAPI.resetField(fieldId);
          loadData();
          setHasChanges(false);
          onSave?.();
          toast.success('Field reset successfully', { id: toastId });
        } catch (error) {
          console.error('Error resetting field:', error);
          toast.error('Failed to reset field', { id: toastId });
        }
      }
    );
  };

  const handleDownloadCSV = async () => {
    const toastId = toast.loading('Preparing CSV export...');
    try {
      await exportAPI.downloadCSV(jobId, `job_${jobId}_results.csv`);
      toast.success('CSV downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Failed to download CSV', { id: toastId });
    }
  };

  const handleDownloadJSON = async () => {
    const toastId = toast.loading('Preparing JSON export...');
    try {
      await exportAPI.downloadJSON(jobId, `job_${jobId}_results.json`);
      toast.success('JSON downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Error downloading JSON:', error);
      toast.error('Failed to download JSON', { id: toastId });
    }
  };

  const handleDownloadExcel = async () => {
    const toastId = toast.loading('Preparing Excel export...');
    try {
      await exportAPI.downloadExcel(jobId, `job_${jobId}_results.xlsx`);
      toast.success('Excel downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading fields...</p>
        </div>
      </div>
    );
  }

  // Filter out metadata fields (those starting with _)
  const visibleFields = fields.filter(f => !f.field_name.startsWith('_'));
  const totalChanges = fields.filter(f => f.is_edited).length + pendingCustomFields.length;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Extracted Fields</h3>
            {template && (
              <p className="text-sm text-gray-600 mt-1">Template: {template.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                {totalChanges} unsaved change{totalChanges !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={handleSaveAll}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
          >
            <Download size={14} />
            Excel
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
          >
            <Download size={14} />
            CSV
          </button>
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition"
          >
            <Download size={14} />
            JSON
          </button>
        </div>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-y-auto p-4">
        {visibleFields.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No fields extracted yet
          </div>
        ) : (
          <div className="space-y-3">
            {visibleFields.map(field => (
              <div
                key={field.id}
                className={`border rounded-lg p-4 transition ${field.is_edited ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {field.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      {field.is_edited && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                          Edited
                        </span>
                      )}
                    </div>

                    {editingFieldId === field.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={field.current_value || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="flex-1 px-3 py-2 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => saveField(field.id)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
                          title="Save"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 bg-gray-400 hover:bg-gray-500 text-white rounded transition"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                          {field.current_value || <span className="text-gray-400 italic">No value</span>}
                        </p>
                        <button
                          onClick={() => startEditing(field.id)}
                          className="p-2 hover:bg-gray-100 rounded transition text-gray-600"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    )}

                    {field.is_edited && field.original_value && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <span>Original: {field.original_value}</span>
                        <button
                          onClick={() => handleReset(field.id)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition"
                        >
                          <RotateCcw size={12} />
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Custom Fields Section */}
            <div className="mt-6 pt-6 border-t-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-purple-900">Custom Fields</h4>
                <button
                  onClick={() => setIsAddingCustomField(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition"
                >
                  <Plus size={16} />
                  Add Field
                </button>
              </div>

              {/* Add Custom Field Form */}
              {isAddingCustomField && (
                <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCustomField.field_name}
                      onChange={(e) => setNewCustomField({ ...newCustomField, field_name: e.target.value })}
                      placeholder="e.g., Invoice Number, Notes"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Value
                    </label>
                    <input
                      type="text"
                      value={newCustomField.field_value}
                      onChange={(e) => setNewCustomField({ ...newCustomField, field_value: e.target.value })}
                      placeholder="Enter value"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Type
                    </label>
                    <select
                      value={newCustomField.field_type}
                      onChange={(e) => setNewCustomField({ ...newCustomField, field_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCustomField}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
                    >
                      <Check size={16} />
                      Add Field
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCustomField(false);
                        setNewCustomField({ field_name: '', field_value: '', field_type: 'text' });
                      }}
                      className="flex items-center gap-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm transition"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Custom Fields */}
              {customFields.map(field => (
                <div key={field.id} className="mb-2 p-3 border border-purple-200 rounded-lg bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{field.field_name}</div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        {field.field_value || <span className="italic text-gray-400">No value</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Type: <span className="font-medium">{field.field_type}</span>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Saved</span>
                  </div>
                </div>
              ))}

              {/* Pending Custom Fields */}
              {pendingCustomFields.map(field => (
                <div key={field.id} className="mb-2 p-3 border-2 border-yellow-300 rounded-lg bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{field.field_name}</div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        {field.field_value || <span className="italic text-gray-400">No value</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Type: <span className="font-medium">{field.field_type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Pending</span>
                      <button
                        onClick={() => handleRemovePendingCustomField(field.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {customFields.length === 0 && pendingCustomFields.length === 0 && !isAddingCustomField && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No custom fields added yet. Click "Add Field" to create one.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {visibleFields.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{visibleFields.length} extracted fields | {customFields.length + pendingCustomFields.length} custom fields</span>
            <span>{totalChanges} pending change{totalChanges !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}
