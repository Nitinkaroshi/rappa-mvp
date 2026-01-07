import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Search, Filter, Download, Trash2, Eye, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { authAPI, processingAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import toast from '../utils/toast.jsx';
import { Card, Button, Badge } from '../components/ui';

function Documents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => authAPI.me(),
    staleTime: 10 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      if (error.response?.status === 401) navigate('/login');
    },
  });

  // Fetch all jobs (documents)
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => processingAPI.getJobs({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10000,
  });

  const jobs = Array.isArray(jobsData) ? jobsData : jobsData?.jobs || [];

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  const handleDelete = async (jobId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const loadingToast = toast.loading('Deleting document...');
      await processingAPI.deleteJob(jobId);
      queryClient.invalidateQueries(['jobs']);
      toast.success('Document deleted successfully', { id: loadingToast });
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete document');
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'failed': return 'error';
      case 'queued': return 'warning';
      default: return 'neutral';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  // Check for PDF/Image
  const isPdf = (filename) => filename?.toLowerCase().endsWith('.pdf');

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toString().includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader user={user} onLogout={handleLogout} title="Documents" />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Documents</h1>
                <p className="text-gray-600 mt-1">
                  Manage and track your document processing pipeline
                </p>
              </div>
              <Button
                variant="primary"
                icon={<Plus size={20} />}
                onClick={() => navigate('/upload')}
                className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Upload New Document
              </Button>
            </div>

            <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <Card.Header className="bg-white border-b border-gray-200 p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by filename or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                    {['all', 'completed', 'processing', 'failed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${filterStatus === status
                            ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-500/20 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </Card.Header>

              {/* Table Content */}
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading your documents...</p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No documents found</h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery ? `No matches for "${searchQuery}"` : "Get started by uploading your first document"}
                    </p>
                    <Button variant="primary" onClick={() => navigate('/upload')}>
                      Upload Document
                    </Button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Document</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Uploaded</th>
                        <th className="px-6 py-4">Size</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredJobs.map((job, index) => (
                        <tr
                          key={job.id}
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="group hover:bg-gray-50/80 transition-colors duration-150 cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isPdf(job.filename) ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                <FileText size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-xs group-hover:text-primary-600 transition-colors">
                                  {job.filename || `Document ${job.id}`}
                                </p>
                                <p className="text-xs text-gray-500 font-mono">#{job.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={getStatusVariant(job.status)} size="sm" className="capitalize">
                              {job.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 font-medium px-2 py-1 bg-gray-100 rounded">
                              {job.file_type?.toUpperCase() || 'PDF'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 whitespace-nowrap">
                              {formatDate(job.created_at)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                            {formatFileSize(job.file_size)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/jobs/${job.id}`);
                                }}
                                title="View Details"
                              >
                                <Eye size={16} className="text-gray-500 hover:text-primary-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                                title="Download"
                              >
                                <Download size={16} className="text-gray-500 hover:text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(job.id, job.filename);
                                }}
                                title="Delete"
                              >
                                <Trash2 size={16} className="text-gray-500 hover:text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination (Simplified for now) */}
              {filteredJobs.length > 0 && (
                <Card.Footer className="bg-white border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">{filteredJobs.length}</span> documents
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled icon={<ChevronLeft size={16} />}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled >
                        Next <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card.Footer>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Documents;
