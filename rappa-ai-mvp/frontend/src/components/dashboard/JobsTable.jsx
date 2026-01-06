import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, TrendingUp, Eye, Search } from 'lucide-react';

export default function JobsTable({ jobs, onViewResults, onActivityClick, selectedJobs = [], onSelectionChange }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate stats
  const stats = {
    total: jobs.length,
    queued: jobs.filter(j => j.status === 'queued').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesSearch = searchQuery === '' ||
      job.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const completedJobIds = filteredJobs
        .filter(job => job.status === 'completed')
        .map(job => job.id);
      onSelectionChange?.(completedJobIds);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectJob = (jobId, checked) => {
    if (checked) {
      onSelectionChange?.([...selectedJobs, jobId]);
    } else {
      onSelectionChange?.(selectedJobs.filter(id => id !== jobId));
    }
  };

  const completedFilteredJobs = filteredJobs.filter(job => job.status === 'completed');
  const allCompletedSelected = completedFilteredJobs.length > 0 &&
    completedFilteredJobs.every(job => selectedJobs.includes(job.id));

  // Status badge
  const StatusBadge = ({ status }) => {
    const config = {
      queued: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        icon: Clock
      },
      processing: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: TrendingUp
      },
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: CheckCircle
      },
      failed: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: XCircle
      }
    };

    const { bg, text, border, icon: Icon } = config[status] || config.queued;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${bg} ${text} ${border}`}>
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // File icon
  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    return <FileText size={20} className={ext === 'pdf' ? 'text-red-500' : 'text-blue-500'} />;
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Document Processing Jobs</h2>
            {selectedJobs.length > 0 && (
              <span className="text-sm text-gray-600 bg-indigo-100 px-3 py-1 rounded-full">
                {selectedJobs.length} selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {onActivityClick && (
              <button
                onClick={onActivityClick}
                className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-6 py-2 rounded-lg font-medium transition text-center"
              >
                View Activity
              </button>
            )}
            <Link
              to="/upload"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition text-center"
            >
              Upload Document
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters and Select All */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
          <button
            onClick={() => setFilterStatus('queued')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterStatus === 'queued'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Queued ({stats.queued})
          </button>
          <button
            onClick={() => setFilterStatus('processing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterStatus === 'processing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Processing ({stats.processing})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterStatus === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({stats.completed})
          </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterStatus === 'failed'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Failed ({stats.failed})
            </button>
          </div>

          {/* Select All Checkbox */}
          {completedFilteredJobs.length > 0 && onSelectionChange && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allCompletedSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              Select all completed
            </label>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <div className="p-6">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {filterStatus === 'all' ? 'No documents uploaded yet' : `No ${filterStatus} documents`}
            </p>
            <Link to="/upload" className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
              Upload your first document
            </Link>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredJobs.map(job => (
              <div
                key={job.id}
                className={`border rounded-lg p-4 hover:shadow-md transition ${
                  selectedJobs.includes(job.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Checkbox for completed jobs */}
                    {job.status === 'completed' && onSelectionChange && (
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.id)}
                        onChange={(e) => handleSelectJob(job.id, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    )}
                    {getFileIcon(job.filename)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{job.filename}</h3>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={job.status} />
                    {job.status === 'completed' && (
                      <button
                        onClick={() => onViewResults(job)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition"
                      >
                        <Eye size={16} />
                        View Results
                      </button>
                    )}
                    <span className="text-sm text-gray-500">#{job.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
