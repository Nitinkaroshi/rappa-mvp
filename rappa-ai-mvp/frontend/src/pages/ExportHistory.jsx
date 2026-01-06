import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authAPI, accountingExportAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { FileText, Download, CheckCircle, XCircle, Filter, Calendar } from 'lucide-react';

export default function ExportHistory() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [selectedSoftware, setSelectedSoftware] = useState('all');
  const [limit, setLimit] = useState(50);

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

  // Fetch export history
  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['exportHistory', selectedSoftware, limit],
    queryFn: () => accountingExportAPI.getExportHistory(
      selectedSoftware === 'all' ? null : selectedSoftware,
      limit
    ),
    staleTime: 30000,
  });

  const logout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const config = {
      success: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: CheckCircle,
      },
      failed: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: XCircle,
      },
    };

    const { bg, text, border, icon: Icon } = config[status] || config.success;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${bg} ${text} ${border}`}>
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Loading export history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          user={user}
          onLogout={logout}
          isMinimized={sidebarMinimized}
          onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <DashboardHeader
          user={user}
          onLogout={logout}
          title="Export History"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
            {/* Header with Filters */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Accounting Export History</h2>
                  <p className="text-gray-600 mt-1">View and track all your accounting software exports</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Software Filter */}
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    <select
                      value={selectedSoftware}
                      onChange={(e) => setSelectedSoftware(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="all">All Software</option>
                      <option value="tally">Tally Prime</option>
                      <option value="quickbooks">QuickBooks</option>
                      <option value="zoho">Zoho Books</option>
                    </select>
                  </div>

                  {/* Limit Selector */}
                  <select
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="25">Last 25</option>
                    <option value="50">Last 50</option>
                    <option value="100">Last 100</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Export History Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              {!history || history.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No export history found</p>
                  <p className="text-gray-400 mt-2">Your accounting exports will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Software
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jobs
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vouchers
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((export_record) => (
                        <tr key={export_record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Calendar size={16} className="text-gray-400" />
                              {formatDate(export_record.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-green-600" />
                              <span className="text-sm font-medium text-gray-900">
                                {export_record.software === 'tally' && 'Tally Prime'}
                                {export_record.software === 'quickbooks' && 'QuickBooks'}
                                {export_record.software === 'zoho' && 'Zoho Books'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={export_record.file_name}>
                              {export_record.file_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {Array.isArray(export_record.job_ids) ? export_record.job_ids.length : 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {export_record.voucher_count || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={export_record.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                // Navigate to first job in the export
                                const jobId = Array.isArray(export_record.job_ids)
                                  ? export_record.job_ids[0]
                                  : export_record.job_ids;
                                navigate(`/jobs/${jobId}`);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                              View Job
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stats Summary */}
            {history && history.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Exports</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{history.length}</p>
                    </div>
                    <FileText className="text-indigo-600" size={32} />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Vouchers</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {history.reduce((sum, exp) => sum + (exp.voucher_count || 0), 0)}
                      </p>
                    </div>
                    <Download className="text-green-600" size={32} />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Success Rate</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {history.length > 0
                          ? Math.round(
                              (history.filter((exp) => exp.status === 'success').length / history.length) * 100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
