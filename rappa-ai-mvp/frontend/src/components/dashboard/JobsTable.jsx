import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, TrendingUp, Eye, Search, Upload as UploadIcon } from 'lucide-react';
import { Card, Button, Badge } from '../ui';

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

  // Status badge using our Badge component
  const StatusBadge = ({ status }) => {
    const config = {
      queued: { variant: 'warning', icon: <Clock size={14} /> },
      processing: { variant: 'info', icon: <TrendingUp size={14} /> },
      completed: { variant: 'success', icon: <CheckCircle size={14} /> },
      failed: { variant: 'error', icon: <XCircle size={14} /> }
    };

    const { variant, icon } = config[status] || config.queued;

    return (
      <Badge variant={variant} size="sm" icon={icon}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // File icon
  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    return <FileText size={20} className={ext === 'pdf' ? 'text-error-500' : 'text-info-500'} />;
  };

  // Filter button component
  const FilterButton = ({ status, label, count, variant }) => (
    <button
      onClick={() => setFilterStatus(status)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${filterStatus === status
          ? `bg-${variant}-600 text-white shadow-md`
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <Card hover={false}>
      <Card.Header>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Document Processing Jobs</h2>
            {selectedJobs.length > 0 && (
              <Badge variant="primary" size="md">
                {selectedJobs.length} selected
              </Badge>
            )}
          </div>
          <div className="flex gap-3">
            {onActivityClick && (
              <Button variant="outline" size="sm" onClick={onActivityClick}>
                View Activity
              </Button>
            )}
            <Link to="/upload">
              <Button variant="primary" size="sm" icon={<UploadIcon size={16} />}>
                Upload Document
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename..."
              className="input pl-10"
            />
          </div>
        </div>

        {/* Filters and Select All */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <FilterButton status="all" label="All" count={stats.total} variant="primary" />
            <FilterButton status="queued" label="Queued" count={stats.queued} variant="warning" />
            <FilterButton status="processing" label="Processing" count={stats.processing} variant="info" />
            <FilterButton status="completed" label="Completed" count={stats.completed} variant="success" />
            <FilterButton status="failed" label="Failed" count={stats.failed} variant="error" />
          </div>

          {/* Select All Checkbox */}
          {completedFilteredJobs.length > 0 && onSelectionChange && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
              <input
                type="checkbox"
                checked={allCompletedSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="font-medium">Select all completed</span>
            </label>
          )}
        </div>
      </Card.Header>

      <Card.Body>
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium mb-2">
              {filterStatus === 'all' ? 'No documents uploaded yet' : `No ${filterStatus} documents`}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Upload your first document to get started
            </p>
            <Link to="/upload">
              <Button variant="primary" icon={<UploadIcon size={18} />}>
                Upload Document
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredJobs.map((job, index) => (
              <div
                key={job.id}
                style={{ animationDelay: `${index * 30}ms` }}
                className={`border rounded-xl p-4 transition-all duration-200 animate-slide-in-up ${selectedJobs.includes(job.id)
                    ? 'border-primary-300 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-primary-200 hover:shadow-md'
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
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    )}
                    {getFileIcon(job.filename)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{job.filename}</h3>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(job.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={job.status} />
                    {job.status === 'completed' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Eye size={16} />}
                        onClick={() => onViewResults(job)}
                      >
                        View Results
                      </Button>
                    )}
                    <span className="text-xs text-gray-400 font-mono">#{job.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
