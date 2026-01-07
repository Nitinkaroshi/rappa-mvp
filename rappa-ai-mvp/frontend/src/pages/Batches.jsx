import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Download, Trash2, Calendar, FileText, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { Card, Button, Badge, StatCard } from '../components/ui';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Batches() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, all

  useEffect(() => {
    async function load() {
      try {
        const userData = await authAPI.me();
        setUser(userData);
        await loadBatches();
        await loadStats();
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
      }
    }
    load();
  }, [navigate, filter]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const includeExpired = filter === 'all';
      const response = await axios.get(`${API_URL}/api/v1/batches`, {
        params: { include_expired: includeExpired },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatches(response.data);
    } catch (error) {
      console.error('Failed to load batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/api/v1/batches/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleDelete = async (batchId) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_URL}/api/v1/batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadBatches();
      await loadStats();
    } catch (error) {
      alert('Failed to delete batch');
    }
  };

  const handleDownload = async (batchId, batchName, format) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_URL}/api/v1/batches/${batchId}/download/${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch_${batchId}_${batchName}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download batch');
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  const getStatusVariant = (status) => {
    const map = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      failed: 'error'
    };
    return map[status] || 'neutral';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
      />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader user={user} onLogout={handleLogout} title="Batch Processing" />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Batch Processing</h1>
                <p className="text-gray-600 mt-1">Process multiple documents using custom templates.</p>
              </div>
              <Button
                onClick={() => navigate('/batches/create')}
                disabled={stats && stats.slots_available === 0}
                variant="primary"
                icon={<Plus size={20} />}
              >
                Create Batch
              </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  label="Active Batches"
                  value={stats.active_batches}
                  icon={<Package size={24} />}
                  trend={{ label: `${stats.slots_available}/${stats.max_allowed} slots left`, value: '', isPositive: true }}
                  color="primary"
                />
                <StatCard
                  label="Completed"
                  value={stats.completed_batches}
                  icon={<CheckCircle size={24} />}
                  color="success"
                />
                <StatCard
                  label="Expired"
                  value={stats.expired_batches}
                  icon={<Clock size={24} />}
                  color="warning"
                />
                <StatCard
                  label="Total Processed"
                  value={stats.total_batches}
                  icon={<FileText size={24} />}
                  color="secondary"
                />
              </div>
            )}

            {/* Warning */}
            {stats && stats.slots_available === 0 && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-warning-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <div className="font-bold text-warning-900">Batch limit reached</div>
                  <div className="text-sm text-warning-700 mt-1">
                    You've reached the maximum of {stats.max_allowed} active batches.
                    Please delete or wait for batches to expire before creating new ones.
                  </div>
                </div>
              </div>
            )}

            {/* Content Card with Filter and List */}
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex gap-2 bg-gray-50/50">
                <button
                  onClick={() => setFilter('active')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'active'
                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                    }`}
                >
                  Active Batches
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                    }`}
                >
                  All Batches
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
              ) : batches.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No batches found</h3>
                  <p className="text-gray-600 mb-6">Create your first batch to process multiple documents at once.</p>
                  <Button
                    onClick={() => navigate('/batches/create')}
                    variant="outline"
                    icon={<Plus size={18} />}
                  >
                    Create Batch
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {batches.map(batch => (
                    <div key={batch.id} className="p-6 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary-50 text-primary-600 rounded-xl group-hover:bg-primary-100 transition-colors">
                            <Package size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-gray-900">{batch.name}</h3>
                              <Badge variant={getStatusVariant(batch.status)} size="sm" className="capitalize">
                                {batch.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <FileText size={14} /> {batch.document_count} documents
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={14} /> Created {new Date(batch.created_at).toLocaleDateString()}
                              </span>
                              <span className={`flex items-center gap-1 ${batch.days_until_expiry <= 7 ? 'text-warning-600 font-medium' : ''}`}>
                                <Clock size={14} />
                                {batch.days_until_expiry > 0 ? `Expires in ${batch.days_until_expiry} days` : 'Expired'}
                              </span>
                            </div>
                            {batch.days_until_expiry <= 7 && batch.days_until_expiry > 0 && (
                              <p className="text-xs text-warning-700 mt-2 font-medium">
                                ⚠️ Expiring soon. Download result.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {batch.status === 'completed' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(batch.id, batch.name, 'csv')}
                                className="text-success-600 hover:text-success-700 hover:bg-success-50"
                                title="Download CSV"
                              >
                                <Download size={18} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(batch.id, batch.name, 'excel')}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Download Excel"
                              >
                                <FileText size={18} />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(batch.id)}
                            className="text-error-500 hover:text-error-700 hover:bg-error-50"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Batches;
