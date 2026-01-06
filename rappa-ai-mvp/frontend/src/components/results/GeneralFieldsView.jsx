import { FileText, AlertCircle, AlertTriangle } from 'lucide-react';
import ConfidenceIndicator from './ConfidenceIndicator';

export default function GeneralFieldsView({ fields, selectedFieldIds = [], onFieldToggle = null, showCheckboxes = false, validationResults = null }) {
  // Filter out metadata fields and table fields
  const generalFields = fields.filter(field => {
    const isMetadata = field.field_name.startsWith('_');
    const isTableField = field.field_name.includes('table_') || field.field_name.includes('row_');
    return !isMetadata && !isTableField;
  });

  if (generalFields.length === 0) {
    return (
      <div className="p-12 text-center bg-gradient-to-br from-gray-50 to-indigo-50 rounded-lg border-2 border-dashed border-gray-300">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-semibold text-lg">No general fields extracted</p>
        <p className="text-gray-500 text-sm mt-2">Try uploading a different document or using a template</p>
      </div>
    );
  }

  // Group fields by category if they have prefixes
  const groupedFields = generalFields.reduce((acc, field) => {
    // Check if field has a category prefix (e.g., "invoice_", "customer_")
    const parts = field.field_name.split('_');
    const category = parts.length > 1 ? parts[0] : 'General';

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(field);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedFields).map(([category, categoryFields]) => (
        <div key={category} className="border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
          {/* Category Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3.5 border-b border-indigo-600">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white capitalize text-base">
                {category} Fields
              </h3>
              <span className="text-sm text-indigo-100 font-medium">
                ({categoryFields.length} {categoryFields.length === 1 ? 'field' : 'fields'})
              </span>
            </div>
          </div>

          {/* Fields List */}
          <div className="divide-y divide-gray-200">
            {categoryFields.map((field) => {
              // Parse confidence if available
              const confidence = field.confidence || field.extraction_confidence;
              const hasLowConfidence = confidence && parseFloat(confidence) < 0.85;

              const isSelected = selectedFieldIds.includes(field.id);

              // Check validation results for this field
              const validationResult = validationResults?.validation_results?.find(
                v => v.field_id === field.id
              );
              const hasValidationError = validationResult && !validationResult.is_valid;

              return (
                <div
                  key={field.id}
                  className={`p-4 hover:bg-gray-50 transition-all duration-200 ${
                    hasLowConfidence ? 'bg-yellow-50' : 'bg-white'
                  } ${isSelected && showCheckboxes ? 'bg-indigo-50 border-l-4 border-indigo-500 shadow-inner' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Checkbox (if enabled) */}
                    {showCheckboxes && onFieldToggle && (
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onFieldToggle(field.id)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Field Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-bold text-gray-800 capitalize">
                          {field.field_name.replace(/_/g, ' ')}
                        </label>
                        {field.is_required && (
                          <span className="text-red-500 text-sm font-bold">*</span>
                        )}
                      </div>

                      {/* Field Value */}
                      <div className="text-sm text-gray-900 bg-gradient-to-br from-white to-gray-50 px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm font-medium">
                        {field.current_value || field.original_value || '-'}
                      </div>

                      {/* Original Value (if different) */}
                      {field.original_value && field.current_value !== field.original_value && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">Original: </span>
                          <span className="line-through">{field.original_value}</span>
                        </div>
                      )}

                      {/* Low Confidence Warning */}
                      {hasLowConfidence && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-700">
                          <AlertCircle className="w-3 h-3" />
                          <span>Low confidence - please verify</span>
                        </div>
                      )}

                      {/* Validation Error Warning */}
                      {hasValidationError && (
                        <div className="mt-2 flex items-start gap-2 text-xs text-orange-800 bg-gradient-to-r from-orange-50 to-red-50 px-3 py-2 rounded-lg border border-orange-300 shadow-sm">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-600" />
                          <div>
                            <div className="font-bold text-orange-900">Invalid Format</div>
                            <div className="text-orange-700 font-medium">{validationResult.error_message}</div>
                            {validationResult.format_template && (
                              <div className="text-orange-600 mt-1 font-medium">Expected: {validationResult.format_template}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confidence Indicator */}
                    {confidence && (
                      <div className="flex-shrink-0">
                        <ConfidenceIndicator confidence={confidence} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
