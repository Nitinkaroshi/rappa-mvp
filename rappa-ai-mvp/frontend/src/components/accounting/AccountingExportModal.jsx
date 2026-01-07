import React, { useState, useEffect } from 'react';
import { X, FileText, Download, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Save, Trash2, Calculator } from 'lucide-react';
import { accountingExportAPI } from '../../services/api';
import { Button, Badge } from '../ui';

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
      const schemaData = await accountingExportAPI.getConfigSchema(software.id);
      setConfigSchema(schemaData);
      setConfig(schemaData.default_config);

      const configs = await accountingExportAPI.getSavedConfigs(software.id);
      setSavedConfigs(configs);

      const defaultConfig = configs.find(c => c.is_default);
      if (defaultConfig) {
        setConfig(defaultConfig.config);
        setSelectedConfigId(defaultConfig.id);
      }

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
      if (jobIds && jobIds.length > 1) {
        const filename = `${selectedSoftware.id}_batch_export_${Date.now()}.${selectedSoftware.file_format.toLowerCase()}`;
        await accountingExportAPI.batchExport(jobIds, selectedSoftware.id, config, filename);
      } else {
        const filename = `${selectedSoftware.id}_export_job${jobId}_${Date.now()}.${selectedSoftware.file_format.toLowerCase()}`;
        await accountingExportAPI.generateExport(jobId, selectedSoftware.id, config, filename);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <Calculator size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Export to Accounting</h2>
              {jobIds && jobIds.length > 1 && (
                <p className="text-sm text-gray-500 mt-1">Batch export: {jobIds.length} jobs selected</p>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {['Select Software', 'Configure', 'Preview & Download'].map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = step >= stepNum;
              const isCurrent = step === stepNum;
              return (
                <div key={idx} className={`flex items-center gap-2 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {isCurrent ? stepNum : (isActive ? <CheckCircle size={16} /> : stepNum)}
                  </div>
                  <span className={`font-medium text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
                  {idx < 2 && <ArrowRight size={16} className="ml-4 text-gray-300" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          {/* Step 1: Select Software */}
          {step === 1 && (
            <div className="max-w-3xl mx-auto">
              <p className="text-gray-600 mb-6 text-center">Select the accounting software you want to export your data to:</p>
              {loading ? (
                <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {supportedSoftware.map((software) => (
                    <button
                      key={software.id}
                      onClick={() => handleSelectSoftware(software)}
                      className="group border-2 border-gray-100 rounded-xl p-5 hover:border-primary-500 hover:bg-primary-50/30 transition-all text-left relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-700">{software.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{software.description}</p>
                          <div className="flex items-center gap-2 mt-4">
                            <Badge variant="secondary" size="sm">{software.file_format}</Badge>
                            <span className="text-xs text-gray-400">{software.required_fields.length} required fields</span>
                          </div>
                        </div>
                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 2 && selectedSoftware && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedSoftware.name} Configuration</h3>
                  <p className="text-sm text-gray-500">Map your fields and configure export settings.</p>
                </div>
                {savedConfigs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      className="text-sm border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      value={selectedConfigId || ''}
                      onChange={(e) => handleLoadConfig(e.target.value)}
                    >
                      <option value="">Load Saved Config...</option>
                      {savedConfigs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {selectedConfigId && (
                      <Button variant="ghost" size="sm" icon={<Trash2 size={16} />} onClick={() => handleDeleteConfig(selectedConfigId)} className="text-red-500 hover:text-red-700 hover:bg-red-50" />
                    )}
                  </div>
                )}
              </div>

              {validation && (
                <div className={`p-4 rounded-xl border ${validation.valid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start gap-4">
                    {validation.valid ? <CheckCircle className="text-green-600 mt-1" /> : <AlertCircle className="text-amber-600 mt-1" />}
                    <div>
                      <h4 className={`font-bold ${validation.valid ? 'text-green-800' : 'text-amber-800'}`}>
                        {validation.valid ? 'Ready for Export' : 'Validation Issues Found'}
                      </h4>
                      <p className="text-sm opacity-80 mt-1 mb-2">{validation.total_documents} documents valid.</p>
                      {validation.errors.length > 0 && (
                        <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
                          {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      )}
                      {validation.warnings.length > 0 && (
                        <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                          {validation.warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                {selectedSoftware.id === 'tally' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Type</label>
                        <select
                          className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                          value={config.voucher_type || 'Purchase'}
                          onChange={(e) => handleConfigChange('voucher_type', e.target.value)}
                        >
                          <option value="Purchase">Purchase Voucher</option>
                          <option value="Sales">Sales Voucher</option>
                          <option value="Payment">Payment Voucher</option>
                          <option value="Receipt">Receipt Voucher</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Party Ledger Name</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Sundry Creditors"
                          value={config.ledger_mappings?.party || 'Sundry Creditors'}
                          onChange={(e) => handleConfigChange('ledger_mappings.party', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'CGST Ledger', key: 'cgst', def: 'CGST Payable' },
                        { label: 'SGST Ledger', key: 'sgst', def: 'SGST Payable' },
                        { label: 'IGST Ledger', key: 'igst', def: 'IGST Payable' },
                      ].map(field => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                          <input
                            type="text"
                            className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                            placeholder={field.def}
                            value={config.ledger_mappings?.[field.key] || field.def}
                            onChange={(e) => handleConfigChange(`ledger_mappings.${field.key}`, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && preview && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex bg-gray-50 p-4 rounded-xl border border-gray-200 justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900">Preview Data</h3>
                  <p className="text-sm text-gray-500">{preview.total_count} records ready.</p>
                </div>
                <Badge variant="success">Validated</Badge>
              </div>

              <div className="space-y-3">
                {preview.preview_data.map((item, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900">Record #{idx + 1}</h4>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{item.voucher_type || item.type}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div><span className="text-gray-500 block text-xs">Date</span>{item.date}</div>
                      <div><span className="text-gray-500 block text-xs">Party</span>{item.party_name}</div>
                      <div><span className="text-gray-500 block text-xs">Number</span>{item.voucher_number || item.number}</div>
                      <div><span className="text-gray-500 block text-xs">Entries</span>{item.ledger_entries?.length || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)} icon={<ArrowLeft size={16} />}>Back</Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            {step === 2 && (
              <>
                <Button variant="secondary" onClick={() => setShowSaveDialog(true)} icon={<Save size={16} />}>Save Config</Button>
                <Button
                  variant="primary"
                  onClick={handlePreview}
                  disabled={loading || (validation && !validation.valid)}
                  loading={loading}
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                >
                  Preview
                </Button>
              </>
            )}
            {step === 3 && (
              <Button
                variant="success"
                onClick={handleDownload}
                loading={loading}
                icon={<Download size={16} />}
              >
                Download Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in-up">
            <h3 className="text-lg font-bold mb-4">Save Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Config Name</label>
                <input
                  type="text"
                  autoFocus
                  className="w-full rounded-lg border-gray-300 focus:ring-primary-500"
                  placeholder="e.g. Monthly Purchase Export"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveDefault"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="saveDefault" className="text-sm text-gray-700">Set as default</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveConfig} disabled={!newConfigName.trim()}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountingExportModal;
