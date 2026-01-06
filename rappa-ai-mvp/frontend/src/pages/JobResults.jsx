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
import { ArrowLeft, RefreshCw, Download, FileJson, FileSpreadsheet, FileText, FileImage, Eye, Sparkles, X, Grid3x3, List, Calculator } from 'lucide-react';

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
          // Don't block the UI if validation fails
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

      // Find template with matching name or document type
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
    // Refresh job data after fields are saved
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
        case 'json':
          await exportAPI.downloadJSON(jobId, `${baseFilename}.json`);
          break;
        case 'csv':
          await exportAPI.downloadCSV(jobId, `${baseFilename}.csv`);
          break;
        case 'csv-selective':
          if (selectedFieldIds.length === 0) {
            alert('Please select at least one field to export');
            return;
          }
          await exportAPI.downloadSelectiveCSV(jobId, selectedFieldIds, `selected_${baseFilename}.csv`);
          break;
        case 'excel':
          await exportAPI.downloadExcel(jobId, `${baseFilename}.xlsx`);
          break;
        case 'pdf':
          await exportAPI.downloadPDF(jobId, `report_${jobId}_${job.filename.replace(/\.[^/.]+$/, '')}.pdf`);
          break;
        case 'tally':
          await exportAPI.downloadTally(jobId, `tally_${jobId}_${job.filename.replace(/\.[^/.]+$/, '')}.csv`);
          break;
        case 'tally-selective':
          if (selectedFieldIds.length === 0) {
            alert('Please select at least one field to export');
            return;
          }
          await exportAPI.downloadSelectiveTally(jobId, selectedFieldIds, `selected_tally_${jobId}_${job.filename.replace(/\.[^/.]+$/, '')}.csv`);
          break;
        default:
          break;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-gray-700 text-lg font-semibold">Loading job results...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-indigo-600">rappa.ai</Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              Back to Dashboard
            </Link>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto py-12 px-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
      {/* Compact Header */}
      <nav className="bg-white shadow-lg border-b border-gray-100 px-4 py-2 flex-shrink-0">
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all">rappa.ai</Link>

          {/* Job Info in Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-900 max-w-xs truncate" title={job.filename}>
                {job.filename}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">Job #{jobId}</span>
              {job.template_id && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                    {job.template_name || job.template_id}
                  </span>
                </>
              )}
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                ✓ Completed
              </span>
            </div>

            {/* View Selector Button */}
            <button
              onClick={() => setShowViewSelector(true)}
              className="flex items-center gap-1 px-3 py-1.5 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-semibold"
              title="Select view"
            >
              <Eye size={16} />
              <span>Select View</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm font-semibold"
                title="Export results"
              >
                <Download size={16} />
                <span>Export</span>
              </button>

              {showExportMenu && (
                <>
                  {/* Backdrop to close menu when clicking outside */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportMenu(false)}
                  />

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Selective Export Section (if fields selected) */}
                    {selectedFieldIds.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-200">
                          <p className="text-xs font-semibold text-indigo-700">
                            {selectedFieldIds.length} field{selectedFieldIds.length !== 1 ? 's' : ''} selected
                          </p>
                        </div>
                        <button
                          onClick={() => handleExport('csv-selective')}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-semibold"
                        >
                          <FileText size={16} />
                          <span>Export Selected (CSV)</span>
                        </button>
                        <button
                          onClick={() => handleExport('tally-selective')}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-semibold"
                        >
                          <Calculator size={16} />
                          <span>Export Selected (Tally)</span>
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <div className="px-4 py-2">
                          <p className="text-xs text-gray-600">Export all fields:</p>
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => handleExport('json')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150 font-medium"
                    >
                      <FileJson size={16} className="text-blue-600" />
                      <span>Export as JSON</span>
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-150 font-medium"
                    >
                      <FileText size={16} className="text-green-600" />
                      <span>Export as CSV</span>
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-150 font-medium"
                    >
                      <FileSpreadsheet size={16} className="text-emerald-600" />
                      <span>Export as Excel</span>
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-150 font-medium"
                    >
                      <FileImage size={16} className="text-red-600" />
                      <span>Export as PDF</span>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => setShowAccountingExport(true)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-150"
                    >
                      <Calculator size={16} className="text-indigo-600" />
                      <span className="font-semibold">Export to Accounting Software</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDataViewMode('list')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition ${dataViewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="List View"
              >
                <List size={16} />
                <span>List</span>
              </button>
              <button
                onClick={() => setDataViewMode('grid')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition ${dataViewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Grid View"
              >
                <Grid3x3 size={16} />
                <span>Grid</span>
              </button>
            </div>

            <button
              onClick={loadJobData}
              className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>

            <Link
              to="/dashboard"
              className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content - Full Height */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 space-y-3">
          {/* Template Suggestion Banner */}
          {showTemplateSuggestion && matchingTemplate && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkles className="text-purple-600" size={24} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-purple-900">
                      Better Results Available!
                    </h3>
                    <button
                      onClick={() => setShowTemplateSuggestion(false)}
                      className="ml-auto text-purple-600 hover:text-purple-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-purple-800 mb-3">
                    We detected this is a <strong>{extractionMeta.documentType}</strong>.
                    We have a specialized template "<strong>{matchingTemplate.name}</strong>" that can extract data with higher accuracy and more fields.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/upload?template=${matchingTemplate.id}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      <Sparkles size={16} />
                      Re-process with Template
                    </button>
                    <button
                      onClick={() => setShowTemplateSuggestion(false)}
                      className="px-4 py-2 bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 rounded-lg font-medium transition-colors text-sm"
                    >
                      Continue with Current Results
                    </button>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    💡 Using templates provides predefined fields and better extraction accuracy
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fraud Detection Panel */}
          {job && job.fraud_analysis && (
            <FraudDetectionPanel fraudAnalysis={job.fraud_analysis} />
          )}

          {/* AI-Generated Document Analysis */}
          {extractionMeta && (
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              {/* Document Type & Confidence Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 border-b border-indigo-700 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-indigo-100 mb-1 font-medium uppercase tracking-wide">Document Type</p>
                    <h3 className="text-2xl font-bold text-white">{extractionMeta.documentType}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-indigo-100 mb-2 font-medium uppercase tracking-wide">Extraction Confidence</p>
                    <ConfidenceIndicator confidence={extractionMeta.confidence} size="lg" showPercentage={true} />
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="p-5">
                <div className="flex items-start gap-2 mb-3">
                  <FileText size={20} className="text-indigo-600 mt-1 flex-shrink-0" />
                  <h4 className="text-base font-bold text-gray-800">AI Summary</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-gradient-to-br from-gray-50 to-indigo-50 p-4 rounded-lg border border-indigo-100 shadow-sm">
                  {extractionMeta.summary}
                </p>
              </div>
            </div>
          )}

          {/* Dynamic View Based on Selection */}
          {currentView === 'data_only' && (
            <div className="space-y-3">
              {/* General Fields Only */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900 text-lg">General Fields</h3>
                      {validationResults && validationResults.invalid_count > 0 && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold shadow-sm">
                          {validationResults.invalid_count} format {validationResults.invalid_count === 1 ? 'error' : 'errors'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowSelectiveExport(!showSelectiveExport)}
                      className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                    >
                      {showSelectiveExport ? 'Hide Selection' : 'Select Fields'}
                    </button>
                  </div>
                  {showSelectiveExport && (
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <button
                        onClick={handleSelectAll}
                        className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-lg transition-all duration-150 border border-gray-300 hover:border-indigo-300 font-medium shadow-sm"
                      >
                        Select All
                      </button>
                      <button
                        onClick={handleDeselectAll}
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-all duration-150 border border-gray-300 font-medium shadow-sm"
                      >
                        Deselect All
                      </button>
                      <button
                        onClick={handleSelectHighConfidence}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-all duration-150 border border-green-300 font-medium shadow-sm"
                      >
                        High Confidence (95%+)
                      </button>
                      <button
                        onClick={handleSelectRequired}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-all duration-150 border border-amber-300 font-medium shadow-sm"
                      >
                        Required Fields
                      </button>
                      <span className="ml-auto px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-lg font-semibold shadow-sm border border-indigo-200">
                        {selectedFieldIds.length} selected
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <GeneralFieldsView
                    fields={allFields}
                    selectedFieldIds={selectedFieldIds}
                    onFieldToggle={handleFieldToggle}
                    showCheckboxes={showSelectiveExport}
                    validationResults={validationResults}
                  />
                </div>
              </div>

              {/* Table Fields */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Table Fields</h3>
                </div>
                <div className="p-4">
                  <TableFieldsView fields={allFields} />
                </div>
              </div>
            </div>
          )}

          {currentView === 'document_fields' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" style={{ minHeight: '600px' }}>
              {/* Left: Document Viewer */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <DocumentViewer jobId={jobId} filename={job.filename} />
              </div>

              {/* Right: General Fields */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">General Fields</h3>
                      {validationResults && validationResults.invalid_count > 0 && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          {validationResults.invalid_count} format {validationResults.invalid_count === 1 ? 'error' : 'errors'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowSelectiveExport(!showSelectiveExport)}
                      className="text-sm px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
                    >
                      {showSelectiveExport ? 'Hide Selection' : 'Select Fields'}
                    </button>
                  </div>
                  {showSelectiveExport && (
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <button onClick={handleSelectAll} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition">
                        Select All
                      </button>
                      <button onClick={handleDeselectAll} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition">
                        Deselect All
                      </button>
                      <button onClick={handleSelectHighConfidence} className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition">
                        High Confidence (95%+)
                      </button>
                      <button onClick={handleSelectRequired} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition">
                        Required Fields
                      </button>
                      <span className="ml-auto px-3 py-1 bg-indigo-100 text-indigo-700 rounded font-medium">
                        {selectedFieldIds.length} selected
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
                  <GeneralFieldsView
                    fields={allFields}
                    selectedFieldIds={selectedFieldIds}
                    onFieldToggle={handleFieldToggle}
                    showCheckboxes={showSelectiveExport}
                    validationResults={validationResults}
                  />
                </div>
              </div>
            </div>
          )}

          {currentView === 'document_tables' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" style={{ minHeight: '600px' }}>
              {/* Left: Document Viewer */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <DocumentViewer jobId={jobId} filename={job.filename} />
              </div>

              {/* Right: Table Fields */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Table Fields</h3>
                </div>
                <div className="p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
                  <TableFieldsView fields={allFields} />
                </div>
              </div>
            </div>
          )}

          {currentView === 'full' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[calc(100vh-140px)]">
              {/* Left: Document Viewer */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <DocumentViewer jobId={jobId} filename={job.filename} />
              </div>

              {/* Right: Fields Editor or Data Grid */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    onFieldUpdate={async (fieldId, newValue) => {
                      await fieldsAPI.updateField(fieldId, newValue);
                      await loadJobData();
                    }}
                    onCustomFieldUpdate={async (fieldId, updates) => {
                      await customFieldsAPI.update(fieldId, updates);
                      await loadJobData();
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Selector Modal */}
      {showViewSelector && (
        <ViewSelector
          currentView={currentView}
          onViewChange={(view) => {
            if (view) setCurrentView(view);
            setShowViewSelector(false);
          }}
        />
      )}

      {/* Accounting Export Modal */}
      {showAccountingExport && (
        <AccountingExportModal
          isOpen={showAccountingExport}
          onClose={() => setShowAccountingExport(false)}
          jobId={jobId}
        />
      )}
    </div>
  );
}
