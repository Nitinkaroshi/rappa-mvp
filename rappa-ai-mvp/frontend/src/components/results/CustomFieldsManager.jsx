import { useState, useEffect } from 'react';
import { customFieldsAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';

export default function CustomFieldsManager({ jobId }) {
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newField, setNewField] = useState({
    field_name: '',
    field_value: '',
    field_type: 'text'
  });

  useEffect(() => {
    loadCustomFields();
  }, [jobId]);

  const loadCustomFields = async () => {
    try {
      setLoading(true);
      const fields = await customFieldsAPI.getByJobId(jobId);
      setCustomFields(fields);
      setError(null);
    } catch (err) {
      console.error('Error loading custom fields:', err);
      setError('Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async () => {
    if (!newField.field_name.trim()) {
      alert('Field name is required');
      return;
    }

    try {
      const created = await customFieldsAPI.create(jobId, newField);
      setCustomFields([...customFields, created]);
      setNewField({ field_name: '', field_value: '', field_type: 'text' });
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error creating custom field:', err);
      alert('Failed to create custom field');
    }
  };

  const handleUpdateField = async (fieldId, updates) => {
    try {
      const updated = await customFieldsAPI.update(fieldId, updates);
      setCustomFields(customFields.map(f => f.id === fieldId ? updated : f));
      setEditingField(null);
    } catch (err) {
      console.error('Error updating custom field:', err);
      alert('Failed to update custom field');
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!confirm('Are you sure you want to delete this custom field?')) {
      return;
    }

    try {
      await customFieldsAPI.delete(fieldId);
      setCustomFields(customFields.filter(f => f.id !== fieldId));
    } catch (err) {
      console.error('Error deleting custom field:', err);
      alert('Failed to delete custom field');
    }
  };

  const startEdit = (field) => {
    setEditingField({
      id: field.id,
      field_name: field.field_name,
      field_value: field.field_value || '',
      field_type: field.field_type
    });
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const saveEdit = () => {
    if (editingField) {
      handleUpdateField(editingField.id, {
        field_name: editingField.field_name,
        field_value: editingField.field_value,
        field_type: editingField.field_type
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Custom Fields</h4>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition"
        >
          <Plus size={16} />
          <span>Add Field</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Add New Field Form */}
      {isAddingNew && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newField.field_name}
              onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
              placeholder="e.g., Notes, Reference Number"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Value
            </label>
            <input
              type="text"
              value={newField.field_value}
              onChange={(e) => setNewField({ ...newField, field_value: e.target.value })}
              placeholder="Enter value"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type
            </label>
            <select
              value={newField.field_type}
              onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              onClick={handleAddField}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
            >
              <Save size={16} />
              <span>Save Field</span>
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewField({ field_name: '', field_value: '', field_type: 'text' });
              }}
              className="flex items-center gap-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm transition"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Fields List */}
      {customFields.length === 0 && !isAddingNew && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No custom fields added yet. Click "Add Field" to create one.
        </div>
      )}

      <div className="space-y-2">
        {customFields.map((field) => (
          <div
            key={field.id}
            className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition"
          >
            {editingField && editingField.id === field.id ? (
              // Edit Mode
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={editingField.field_name}
                    onChange={(e) => setEditingField({ ...editingField, field_name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Field Value
                  </label>
                  <input
                    type="text"
                    value={editingField.field_value}
                    onChange={(e) => setEditingField({ ...editingField, field_value: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Field Type
                  </label>
                  <select
                    value={editingField.field_type}
                    onChange={(e) => setEditingField({ ...editingField, field_type: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    onClick={saveEdit}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm transition"
                  >
                    <X size={14} />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
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

                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(field)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Edit field"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    title="Delete field"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
