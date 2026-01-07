import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authAPI, accountingExportAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { Card, Button, Badge, StatCard } from '../components/ui';
import { FileText, Download, CheckCircle, Filter, Calendar, Eye } from 'lucide-react';

export default function ExportHistory() {
  const navigate = useNavigate();
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [selectedSoftware, setSelectedSoftware] = useState('all');
  const [limit, setLimit] = useState(50);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => authAPI.me(),
    onError: (error) => {
      if (error.response?.status === 401) navigate('/login');
    },
  });

  // Fetch export history
  const { data: history, isLoading } = useQuery({
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={logout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
        activePath="/history" // Assume history route
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader user={user} onLogout={logout} title="Export History" />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Accounting Export History</h1>
                <p className="text-gray-600 mt-1">Track and manage your data exports to accounting software.</p>
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <div className="relative group">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={selectedSoftware}
                    onChange={(e) => setSelectedSoftware(e.target.value)}
                    className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
                  >
                    <option value="all">All Software</option>
                    <option value="tally">Tally Prime</option>
                    <option value="quickbooks">QuickBooks</option>
                    <option value="zoho">Zoho Books</option>
                  </select>
                </div>
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
                >
                  <option value="25">Last 25</option>
                  <option value="50">Last 50</option>
                  <option value="100">Last 100</option>
                </select>
              </div>
            </div>

            {/* Stats Summary */}
            {history && history.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Total Exports"
                  value={history.length}
                  icon={<FileText size={24} />}
                  color="primary"
                />
                <StatCard
                  label="Total Vouchers"
                  value={history.reduce((sum, exp) => sum + (exp.voucher_count || 0), 0)}
                  icon={<Download size={24} />}
                  color="secondary"
                />
                <StatCard
                  label="Success Rate"
                  value={`${Math.round((history.filter((exp) => exp.status === 'success').length / history.length) * 100)}%`}
                  icon={<CheckCircle size={24} />}
                  color="success"
                />
              </div>
            )}

            {/* Table Card */}
            <Card className="overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
              ) : !history || history.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No export history</h3>
                  <p className="text-gray-500 mt-1">Your accounting exports will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-semibold text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Software</th>
                        <th className="px-6 py-4">File Name</th>
                        <th className="px-6 py-4 text-center">Jobs</th>
                        <th className="px-6 py-4 text-center">Vouchers</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="font-medium text-gray-900">{formatDate(record.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" size="sm">
                              {record.software === 'tally' ? 'Tally Prime' :
                                record.software === 'quickbooks' ? 'QuickBooks' :
                                  record.software === 'zoho' ? 'Zoho Books' : record.software}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate font-mono text-xs text-gray-500" title={record.file_name}>
                            {record.file_name}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {Array.isArray(record.job_ids) ? record.job_ids.length : 1}
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-gray-900">
                            {record.voucher_count || 0}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={record.status === 'success' ? 'success' : 'error'} size="sm" className="capitalize">
                              {record.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const jobId = Array.isArray(record.job_ids) ? record.job_ids[0] : record.job_ids;
                                navigate(`/jobs/${jobId}`);
                              }}
                              icon={<Eye size={16} />}
                            >
                              View Job
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}
