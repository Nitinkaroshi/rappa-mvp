import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { processingAPI, exportAPI, fieldsAPI, templatesAPI, customFieldsAPI, validationAPI } from '../services/api';
import DocumentViewer from '../components/editor/DocumentViewer';
import FieldsEditor from '../components/editor/FieldsEditor';
import ViewSelector from '../components/results/ViewSelector';
import ConfidenceIndicator from '../components/results/ConfidenceIndicator';
import GeneralFieldsView from '../components/results/GeneralFieldsView';
import TableFieldsView from '../components/results/TableFieldsView';
import FraudDetectionPanel from '../components/results/FraudDetectionPanel';
import DataGridView from '../components/results/DataGridView';
import AccountingExportModal from '../components/accounting/AccountingExportModal';
import { ArrowLeft, RefreshCw, Download, FileJson, FileSpreadsheet, FileText, FileImage, Eye, Sparkles, X, Grid3x3, List, Calculator, AlertCircle } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';

export default function JobResults() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [extractionMeta, setExtractionMeta] = useState(null);
  const [currentView, setCurrentView] = useState('full');
  const [showViewSelector, setShowViewSelector] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [matchingTemplate, setMatchingTemplate] = useState(null);
  const [showTemplateSuggestion, setShowTemplateSuggestion] = useState(false);
  const [dataViewMode, setDataViewMode] = useState('list'); // 'list' or 'grid'
  const [selectedFieldIds, setSelectedFieldIds] = useState([]);
  const [showSelectiveExport, setShowSelectiveExport] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [showAccountingExport, setShowAccountingExport] = useState(false);

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  const loadJobData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobData, fieldsData, customFieldsData] = await Promise.all([
        processingAPI.getJobStatus(jobId),
        fieldsAPI.getJobFields(jobId).catch(() => []),
        customFieldsAPI.getByJobId(jobId).catch(() => [])
      ]);

      if (jobData.status !== 'completed') {
        setError(`Job status is "${jobData.status}". Results are only available for completed jobs.`);
      } else {
        setJob(jobData);

        // Extract metadata fields (_document_type, _confidence, _summary)
        const docType = fieldsData.find(f => f.field_name === '_document_type');
        const confidence = fieldsData.find(f => f.field_name === '_confidence');
        const summary = fieldsData.find(f => f.field_name === '_summary');

        setExtractionMeta({
          documentType: docType?.current_value || 'Unknown',
          confidence: confidence?.current_value || 'N/A',
          summary: summary?.current_value || 'No summary available'
        });

        // Store all fields for view switching
        setAllFields(fieldsData);
        setCustomFields(customFieldsData);

        // Load validation results
        try {
          const validationData = await validationAPI.validateJob(jobId);
          setValidationResults(validationData);
        } catch (err) {
          console.warn('Validation failed:', err);
        }

        // Check for matching template if auto-detect was used (no template_id)
        if (!jobData.template_id && docType?.current_value) {
          checkForMatchingTemplate(docType.current_value);
        }
      }
    } catch (err) {
      console.error('Error loading job:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Job not found');
      } else {
        setError('Failed to load job data');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkForMatchingTemplate = async (detectedType) => {
    try {
      const templates = await templatesAPI.getAll();
      const match = templates.find(t =>
        t.name.toLowerCase().includes(detectedType.toLowerCase()) ||
        detectedType.toLowerCase().includes(t.name.toLowerCase()) ||
        t.description?.toLowerCase().includes(detectedType.toLowerCase())
      );

      if (match) {
        setMatchingTemplate(match);
        setShowTemplateSuggestion(true);
      }
    } catch (err) {
      console.error('Failed to check for matching template:', err);
    }
  };

  const handleFieldsSaved = () => {
    loadJobData();
  };

  // Field selection handlers for selective export
  const handleFieldToggle = (fieldId) => {
    setSelectedFieldIds(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleSelectAll = () => {
    const exportableFields = allFields.filter(
      f => !f.field_name.startsWith('_') && !f.field_name.includes('table_') && !f.field_name.includes('row_')
    );
    setSelectedFieldIds(exportableFields.map(f => f.id));
  };

  const handleDeselectAll = () => {
    setSelectedFieldIds([]);
  };

  const handleSelectHighConfidence = () => {
    const highConfFields = allFields.filter(
      f => !f.field_name.startsWith('_') &&
        !f.field_name.includes('table_') &&
        !f.field_name.includes('row_') &&
        parseFloat(f.confidence_score || f.confidence || 0) >= 0.95
    );
    setSelectedFieldIds(highConfFields.map(f => f.id));
  };

  const handleSelectRequired = () => {
    const requiredFields = allFields.filter(
      f => !f.field_name.startsWith('_') &&
        !f.field_name.includes('table_') &&
        !f.field_name.includes('row_') &&
        f.is_required
    );
    setSelectedFieldIds(requiredFields.map(f => f.id));
  };

  const handleExport = async (format) => {
    setShowExportMenu(false);
    setExporting(true);

    try {
      const baseFilename = `results_${jobId}_${job.filename.replace(/\.[^/.]+$/, '')}`;

      switch (format) {
        case 'json': await exportAPI.downloadJSON(jobId, `${baseFilename}.json`); break;
        case 'csv': await exportAPI.downloadCSV(jobId, `${baseFilename}.csv`); break;
        case 'csv-selective':
          if (selectedFieldIds.length === 0) return alert('Please select at least one field');
          await exportAPI.downloadSelectiveCSV(jobId, selectedFieldIds, `selected_${baseFilename}.csv`);
          break;
        case 'excel': await exportAPI.downloadExcel(jobId, `${baseFilename}.xlsx`); break;
        case 'pdf': await exportAPI.downloadPDF(jobId, `report_${jobId}.pdf`); break;
        case 'tally': await exportAPI.downloadTally(jobId, `tally_${jobId}.csv`); break;
        case 'tally-selective':
          if (selectedFieldIds.length === 0) return alert('Please select at least one field');
          await exportAPI.downloadSelectiveTally(jobId, selectedFieldIds, `selected_tally_${jobId}.csv`);
          break;
        default: break;
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-900 text-lg font-semibold">Loading job results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">rappa.ai</Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Back to Dashboard</Link>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto py-12 px-6">
          <Card className="p-8 text-center">
            <AlertCircle size={48} className="text-error-500 mx-auto mb-4" />
            <p className="text-error-700 text-lg mb-6">{error}</p>
            <Link to="/dashboard">
              <Button variant="primary" icon={<ArrowLeft size={18} />}>Back to Dashboard</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex-shrink-0 z-10 relative">
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            rappa.ai
          </Link>

          {/* Job Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-900 max-w-xs truncate" title={job.filename}>
                {job.filename}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">#{jobId}</span>
              {job.template_id && (
                <Badge variant="secondary" size="sm">{job.template_name || job.template_id}</Badge>
              )}
              <Badge variant="success" size="sm">Completed</Badge>
            </div>

            {/* View Selector */}
            <Button
              variant="outline"
              size="sm"
              icon={<Eye size={16} />}
              onClick={() => setShowViewSelector(true)}
            >
              Select View
            </Button>

            {/* Export Dropdown */}
            <div className="relative">
              <Button
                variant="primary"
                size="sm"
                icon={<Download size={16} />}
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                loading={exporting}
              >
                Export
              </Button>

              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20 animate-fade-in-up origin-top-right">
                    {selectedFieldIds.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-primary-50 border-b border-primary-100">
                          <p className="text-xs font-semibold text-primary-700">
                            {selectedFieldIds.length} fields selected
                          </p>
                        </div>
                        <button onClick={() => handleExport('csv-selective')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 transition-colors font-medium">
                          <FileText size={16} /> Export Selected (CSV)
                        </button>
                        <button onClick={() => handleExport('tally-selective')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 transition-colors font-medium">
                          <Calculator size={16} /> Export Selected (Tally)
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                      </>
                    )}
                    <button onClick={() => handleExport('json')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                      <FileJson size={16} className="text-blue-500" /> Export as JSON
                    </button>
                    <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                      <FileText size={16} className="text-green-500" /> Export as CSV
                    </button>
                    <button onClick={() => handleExport('excel')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                      <FileSpreadsheet size={16} className="text-emerald-500" /> Export as Excel
                    </button>
                    <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                      <FileImage size={16} className="text-red-500" /> Export as PDF
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button onClick={() => setShowAccountingExport(true)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                      <Calculator size={16} className="text-primary-600" /> Export to Accounting
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* View Mode */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDataViewMode('list')}
                className={`p-1.5 rounded transition ${dataViewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setDataViewMode('grid')}
                className={`p-1.5 rounded transition ${dataViewMode === 'grid' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid3x3 size={18} />
              </button>
            </div>

            <Button variant="ghost" size="sm" icon={<RefreshCw size={16} />} onClick={loadJobData} title="Refresh" />
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>Back</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Suggestion Banner */}
        {showTemplateSuggestion && matchingTemplate && (
          <Card className="bg-purple-50 border-purple-200 shadow-sm animate-slide-in-down">
            <Card.Body className="flex items-start gap-4 p-4">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <Sparkles size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-purple-900">Better Results Available!</h3>
                  <button onClick={() => setShowTemplateSuggestion(false)} className="text-purple-400 hover:text-purple-600"><X size={18} /></button>
                </div>
                <p className="text-sm text-purple-800 mt-1 mb-3">
                  We detected this is a <strong>{extractionMeta.documentType}</strong>. Use template "<strong>{matchingTemplate.name}</strong>" for higher accuracy.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => navigate(`/upload?template=${matchingTemplate.id}`)} icon={<Sparkles size={14} />}>
                    Re-process with Template
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowTemplateSuggestion(false)}>
                    Continue with Current Results
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Fraud Detection */}
        {job && job.fraud_analysis && <FraudDetectionPanel fraudAnalysis={job.fraud_analysis} />}

        {/* AI Summary */}
        {extractionMeta && (
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-4 flex justify-between items-center text-white">
              <div>
                <p className="text-xs opacity-80 uppercase tracking-wider font-semibold">Document Type</p>
                <h3 className="text-xl font-bold">{extractionMeta.documentType}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80 uppercase tracking-wider font-semibold">Confidence</p>
                <div className="flex justify-end">
                  <ConfidenceIndicator confidence={extractionMeta.confidence} size="lg" showPercentage invertColor />
                </div>
              </div>
            </div>
            <Card.Body className="p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-900 font-bold">
                <FileText size={18} className="text-primary-600" /> AI Summary
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                {extractionMeta.summary}
              </p>
            </Card.Body>
          </Card>
        )}

        {/* Views */}
        {currentView === 'data_only' && (
          <div className="space-y-4">
            <Card>
              <Card.Header className="flex justify-between items-center p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">General Fields</h3>
                <Button size="sm" variant={showSelectiveExport ? 'primary' : 'outline'} onClick={() => setShowSelectiveExport(!showSelectiveExport)}>
                  {showSelectiveExport ? 'Hide Selection' : 'Select Fields'}
                </Button>
              </Card.Header>
              {showSelectiveExport && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2">
                  <Button size="xs" variant="outline" onClick={handleSelectAll}>Select All</Button>
                  <Button size="xs" variant="outline" onClick={handleDeselectAll}>Deselect All</Button>
                  <Button size="xs" variant="success" onClick={handleSelectHighConfidence}>High Confidence</Button>
                  <Button size="xs" variant="warning" onClick={handleSelectRequired}>Required</Button>
                </div>
              )}
              <Card.Body className="p-4">
                <GeneralFieldsView
                  fields={allFields}
                  selectedFieldIds={selectedFieldIds}
                  onFieldToggle={handleFieldToggle}
                  showCheckboxes={showSelectiveExport}
                  validationResults={validationResults}
                />
              </Card.Body>
            </Card>
            <Card>
              <Card.Header className="p-4 border-b border-gray-100 font-bold text-gray-900">Table Fields</Card.Header>
              <Card.Body className="p-4"><TableFieldsView fields={allFields} /></Card.Body>
            </Card>
          </div>
        )}

        {currentView === 'document_fields' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px]">
            <Card className="h-full overflow-hidden flex flex-col">
              <DocumentViewer jobId={jobId} filename={job.filename} />
            </Card>
            <Card className="h-full flex flex-col">
              <Card.Header className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">General Fields</h3>
                <Button size="sm" variant="outline" onClick={() => setShowSelectiveExport(!showSelectiveExport)}>
                  {showSelectiveExport ? 'Done' : 'Select'}
                </Button>
              </Card.Header>
              <div className="flex-1 overflow-y-auto p-4">
                <GeneralFieldsView
                  fields={allFields}
                  selectedFieldIds={selectedFieldIds}
                  onFieldToggle={handleFieldToggle}
                  showCheckboxes={showSelectiveExport}
                  validationResults={validationResults}
                />
              </div>
            </Card>
          </div>
        )}

        {currentView === 'document_tables' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px]">
            <Card className="h-full overflow-hidden"><DocumentViewer jobId={jobId} filename={job.filename} /></Card>
            <Card className="h-full flex flex-col">
              <Card.Header className="p-4 border-b border-gray-100 font-bold text-gray-900">Table Fields</Card.Header>
              <div className="flex-1 overflow-y-auto p-4"><TableFieldsView fields={allFields} /></div>
            </Card>
          </div>
        )}

        {currentView === 'full' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-140px)]">
            <Card className="h-full overflow-hidden flex flex-col shadow-lg border-2 border-primary-50">
              <DocumentViewer jobId={jobId} filename={job.filename} />
            </Card>
            <Card className="h-full overflow-hidden flex flex-col shadow-lg">
              {dataViewMode === 'list' ? (
                <FieldsEditor
                  jobId={jobId}
                  templateId={job.template_id}
                  onSave={handleFieldsSaved}
                />
              ) : (
                <DataGridView
                  fields={allFields}
                  customFields={customFields}
                  onFieldUpdate={async (id, val) => { await fieldsAPI.updateField(id, val); loadJobData(); }}
                  onCustomFieldUpdate={async (id, up) => { await customFieldsAPI.update(id, up); loadJobData(); }}
                />
              )}
            </Card>
          </div>
        )}
      </div>

      {showViewSelector && (
        <ViewSelector currentView={currentView} onViewChange={(view) => { if (view) setCurrentView(view); setShowViewSelector(false); }} />
      )}
      {showAccountingExport && (
        <AccountingExportModal isOpen={showAccountingExport} onClose={() => setShowAccountingExport(false)} jobId={jobId} />
      )}
    </div>
  );
}
