import { useState } from 'react';
import { X, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ActivitySidebar({ jobs, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  // Filter jobs based on active tab and last 24 hours
  const getLast24Hours = () => {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    return yesterday;
  };

  const recentJobs = jobs.filter(job => {
    const jobDate = new Date(job.created_at);
    return jobDate >= getLast24Hours();
  });

  const filteredJobs = recentJobs.filter(job => {
    if (activeTab === 'all') return true;
    if (activeTab === 'done') return job.status === 'completed';
    if (activeTab === 'in_progress') return job.status === 'processing' || job.status === 'queued';
    if (activeTab === 'failed') return job.status === 'failed';
    return true;
  });

  const tabs = [
    { id: 'all', label: 'All', count: recentJobs.length },
    { id: 'done', label: 'Done', count: recentJobs.filter(j => j.status === 'completed').length },
    { id: 'in_progress', label: 'In progress', count: recentJobs.filter(j => j.status === 'processing' || j.status === 'queued').length },
    { id: 'failed', label: 'Failed', count: recentJobs.filter(j => j.status === 'failed').length }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
      case 'queued':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'processing':
      case 'queued':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleJobClick = (job) => {
    if (job.status === 'completed') {
      navigate(`/jobs/${job.id}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-900">Activity</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-indigo-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          ))}
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No documents processed in the last 24 hours.
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job)}
                className={`p-4 rounded-lg border transition-all ${getStatusColor(job.status)} ${
                  job.status === 'completed' ? 'cursor-pointer hover:shadow-md' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStatusIcon(job.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {job.filename}
                      </p>
                      {job.status === 'completed' && (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(job.created_at)}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'completed' ? 'bg-green-100 text-green-700' :
                        job.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        job.status === 'queued' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {job.status === 'completed' ? 'Extraction done' :
                         job.status === 'processing' ? 'Processing...' :
                         job.status === 'queued' ? 'Queued' :
                         'Failed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Showing activity from the last 24 hours
          </p>
        </div>
      </div>
    </>
  );
}
