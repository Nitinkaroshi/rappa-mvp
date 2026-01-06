import React, { useState, useEffect } from 'react';
import { X, FileText, Download, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { accountingExportAPI } from '../../services/api';

function AccountingExportModal({ isOpen, onClose, jobId, jobIds }) {
  const [step, setStep] = useState(1); // 1: Select Software, 2: Configure, 3: Preview
  const [supportedSoftware, setSupportedSoftware] = useState([]);
  const [selectedSoftware, setSelectedSoftware] = useState(null);
  const [config, setConfig] = useState({});
  const [configSchema, setConfigSchema] = useState(null);
  const [validation, setValidation] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  // Load supported software on mount
  useEffect(() => {
    if (isOpen) {
      loadSupportedSoftware();
    }
  }, [isOpen]);

  const loadSupportedSoftware = async () => {
    try {
      setLoading(true);
      const data = await accountingExportAPI.getSupportedSoftware();
      setSupportedSoftware(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load supported software:', err);
      setError('Failed to load supported accounting software');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSoftware = async (software) => {
    setSelectedSoftware(software);

    try {
      setLoading(true);
      // Load config schema
      const schemaData = await accountingExportAPI.getConfigSchema(software.id);
      setConfigSchema(schemaData);
      setConfig(schemaData.default_config);

      // Load saved configs
      const configs = await accountingExportAPI.getSavedConfigs(software.id);
      setSavedConfigs(configs);

      // Auto-load default config if exists
      const defaultConfig = configs.find(c => c.is_default);
      if (defaultConfig) {
        setConfig(defaultConfig.config);
        setSelectedConfigId(defaultConfig.id);
      }

      // Validate data (use jobIds if batch export, otherwise jobId)
      const idsToValidate = jobIds || [jobId];
      const validationData = await accountingExportAPI.validateData(idsToValidate[0], software.id);
      setValidation(validationData);

      setError(null);
      setStep(2);
    } catch (err) {
      console.error('Failed to initialize software:', err);
      setError(err.response?.data?.detail || 'Failed to initialize software');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadConfig = (configId) => {
    const savedConfig = savedConfigs.find(c => c.id === parseInt(configId));
    if (savedConfig) {
      setConfig(savedConfig.config);
      setSelectedConfigId(savedConfig.id);
    } else {
      // New configuration
      setConfig(configSchema.default_config);
      setSelectedConfigId(null);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      await accountingExportAPI.saveConfig(
        selectedSoftware.id,
        config,
        newConfigName || 'Default',
        saveAsDefault
      );

      // Reload saved configs
      const configs = await accountingExportAPI.getSavedConfigs(selectedSoftware.id);
      setSavedConfigs(configs);

      setShowSaveDialog(false);
      setNewConfigName('');
      setSaveAsDefault(false);
      alert('Configuration saved successfully!');
    } catch (err) {
      console.error('Failed to save config:', err);
      alert('Failed to save configuration: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (configId) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      await accountingExportAPI.deleteConfig(configId);
      const configs = await accountingExportAPI.getSavedConfigs(selectedSoftware.id);
      setSavedConfigs(configs);
      if (selectedConfigId === configId) {
        setSelectedConfigId(null);
        setConfig(configSchema.default_config);
      }
    } catch (err) {
      console.error('Failed to delete config:', err);
      alert('Failed to delete configuration');
    }
  };

  const handleConfigChange = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      // Use first jobId for preview (batch exports will show combined preview)
      const previewJobId = jobIds ? jobIds[0] : jobId;
      const previewData = await accountingExportAPI.previewExport(
        previewJobId,
        selectedSoftware.id,
        config,
        5
      );
      setPreview(previewData);
      setError(null);
      setStep(3);
    } catch (err) {
      console.error('Failed to generate preview:', err);
      setError(err.response?.data?.detail || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);

      // Check if batch export
      if (jobIds && jobIds.length > 1) {
        const filename = `${selectedSoftware.id}_batch_export_${Date.now()}.${selectedSoftware.file_format.toLowerCase()}`;
        await accountingExportAPI.batchExport(
          jobIds,
          selectedSoftware.id,
          config,
          filename
        );
      } else {
        const filename = `${selectedSoftware.id}_export_job${jobId}_${Date.now()}.${selectedSoftware.file_format.toLowerCase()}`;
        await accountingExportAPI.generateExport(
          jobId,
          selectedSoftware.id,
          config,
          filename
        );
      }

      setError(null);
      alert('Export file downloaded successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to generate export:', err);
      setError(err.response?.data?.detail || 'Failed to generate export file');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedSoftware(null);
    setConfig({});
    setConfigSchema(null);
    setValidation(null);
    setPreview(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Export to Accounting Software
              </h2>
              {jobIds && jobIds.length > 1 && (
                <p className="text-sm text-gray-600 mt-1">
                  Batch export: {jobIds.length} jobs selected
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">Select Software</span>
            </div>
            <ArrowRight className="text-gray-400" size={20} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Configure</span>
            </div>
            <ArrowRight className="text-gray-400" size={20} />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-medium">Preview & Download</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Step 1: Select Software */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Select the accounting software you want to export to:
              </p>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {supportedSoftware.map((software) => (
                    <button
                      key={software.id}
                      onClick={() => handleSelectSoftware(software)}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-600 hover:bg-green-50 transition-all text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{software.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{software.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">Format: {software.file_format}</span>
                            <span className="text-xs text-gray-500">
                              Required fields: {software.required_fields.length}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="text-green-600 flex-shrink-0" size={20} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 2 && selectedSoftware && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedSoftware.name} Settings
                </h3>
                <p className="text-sm text-gray-600">
                  Configure how your data should be exported
                </p>
              </div>

              {/* Saved Config Selector */}
              {savedConfigs.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Load Saved Configuration:</label>
                  <select
                    value={selectedConfigId || ''}
                    onChange={(e) => handleLoadConfig(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">-- New Configuration --</option>
                    {savedConfigs.map((cfg) => (
                      <option key={cfg.id} value={cfg.id}>
                        {cfg.name} {cfg.is_default && '(Default)'}
                      </option>
                    ))}
                  </select>
                  {selectedConfigId && (
                    <button
                      onClick={() => handleDeleteConfig(selectedConfigId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete this configuration"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )}

              {/* Validation Status */}
              {validation && (
                <div className={`p-4 rounded-lg border ${validation.valid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-start gap-3">
                    {validation.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {validation.valid ? 'Data Validated Successfully' : 'Validation Issues Found'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {validation.total_documents} documents ready for export
                      </p>
                      {validation.errors.length > 0 && (
                        <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                          {validation.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      )}
                      {validation.warnings.length > 0 && (
                        <ul className="mt-2 text-sm text-yellow-600 list-disc list-inside">
                          {validation.warnings.map((warn, idx) => (
                            <li key={idx}>{warn}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration Form */}
              <div className="space-y-4">
                {selectedSoftware.id === 'tally' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voucher Type
                      </label>
                      <select
                        value={config.voucher_type || 'Purchase'}
                        onChange={(e) => handleConfigChange('voucher_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="Purchase">Purchase Voucher</option>
                        <option value="Sales">Sales Voucher</option>
                        <option value="Payment">Payment Voucher</option>
                        <option value="Receipt">Receipt Voucher</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Party Ledger Name
                      </label>
                      <input
                        type="text"
                        value={config.ledger_mappings?.party || 'Sundry Creditors'}
                        onChange={(e) => handleConfigChange('ledger_mappings.party', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Sundry Creditors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CGST Ledger Name
                      </label>
                      <input
                        type="text"
                        value={config.ledger_mappings?.cgst || 'CGST Payable'}
                        onChange={(e) => handleConfigChange('ledger_mappings.cgst', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="CGST Payable"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SGST Ledger Name
                      </label>
                      <input
                        type="text"
                        value={config.ledger_mappings?.sgst || 'SGST Payable'}
                        onChange={(e) => handleConfigChange('ledger_mappings.sgst', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="SGST Payable"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IGST Ledger Name
                      </label>
                      <input
                        type="text"
                        value={config.ledger_mappings?.igst || 'IGST Payable'}
                        onChange={(e) => handleConfigChange('ledger_mappings.igst', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="IGST Payable"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && preview && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Preview: {preview.total_count} {selectedSoftware.id === 'tally' ? 'Vouchers' : 'Records'}
                </h3>
                <p className="text-sm text-gray-600">
                  Showing first {preview.preview_data.length} items
                </p>
              </div>

              <div className="space-y-3">
                {preview.preview_data.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {selectedSoftware.id === 'tally' ? 'Voucher' : 'Record'} {idx + 1}
                      </h4>
                      <span className="text-xs text-gray-500">{item.voucher_type || item.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Date:</span> {item.date}
                      </div>
                      <div>
                        <span className="text-gray-600">Party:</span> {item.party_name}
                      </div>
                      <div>
                        <span className="text-gray-600">Number:</span> {item.voucher_number || item.number}
                      </div>
                      <div>
                        <span className="text-gray-600">Entries:</span> {item.ledger_entries?.length || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
                disabled={loading}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
              disabled={loading}
            >
              Cancel
            </button>
            {step === 2 && (
              <>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  <Save size={16} />
                  Save Configuration
                </button>
                <button
                  onClick={handlePreview}
                  disabled={loading || (validation && !validation.valid)}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Preview'}
                  <ArrowRight size={16} />
                </button>
              </>
            )}
            {step === 3 && (
              <button
                onClick={handleDownload}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Download Export'}
                <Download size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Configuration Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Purchase - ACME Corp"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveAsDefault"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="saveAsDefault" className="text-sm text-gray-700">
                  Set as default configuration
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewConfigName('');
                  setSaveAsDefault(false);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={!newConfigName.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountingExportModal;
