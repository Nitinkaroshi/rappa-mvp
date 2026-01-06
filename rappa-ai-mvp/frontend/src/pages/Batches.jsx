import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Download, Trash2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
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

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader user={user} />
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Batch Processing</h1>
                <p className="text-gray-600 mt-1">
                  Process multiple documents using custom templates
                </p>
              </div>
              <button
                onClick={() => navigate('/batches/create')}
                disabled={stats && stats.slots_available === 0}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
                Create Batch
              </button>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-1">Active Batches</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.active_batches}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.slots_available} of {stats.max_allowed} slots available
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-green-600">{stats.completed_batches}</div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-1">Expired</div>
                  <div className="text-2xl font-bold text-orange-600">{stats.expired_batches}</div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Batches</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total_batches}</div>
                </div>
              </div>
            )}

            {/* Batch Limit Warning */}
            {stats && stats.slots_available === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <div className="font-medium text-yellow-900">Batch limit reached</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    You've reached the maximum of {stats.max_allowed} active batches.
                    Please delete or wait for batches to expire before creating new ones.
                  </div>
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Active Batches
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Batches
              </button>
            </div>

            {/* Batches List */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : batches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No batches yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first batch to process multiple documents at once
                </p>
                <button
                  onClick={() => navigate('/batches/create')}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Plus size={20} />
                  Create Your First Batch
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Package className="text-indigo-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{batch.name}</h3>
                            {getStatusBadge(batch.status)}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {batch.document_count} documents
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {batch.status === 'completed' && (
                          <>
                            <button
                              onClick={() => handleDownload(batch.id, batch.name, 'csv')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download CSV"
                            >
                              <Download size={18} />
                            </button>
                            <button
                              onClick={() => handleDownload(batch.id, batch.name, 'excel')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download Excel"
                            >
                              <FileText size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(batch.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete batch"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>Created {new Date(batch.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span className={batch.days_until_expiry <= 7 ? 'text-orange-600 font-medium' : ''}>
                          {batch.days_until_expiry > 0
                            ? `Expires in ${batch.days_until_expiry} days`
                            : 'Expired'}
                        </span>
                      </div>
                    </div>

                    {batch.days_until_expiry <= 7 && batch.days_until_expiry > 0 && (
                      <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                        ⚠️ This batch will expire soon. Download your results before it's automatically deleted.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">About Batches</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You can have up to 5 active batches at a time</li>
                <li>• Batches are automatically deleted after 30 days</li>
                <li>• Download your results in CSV or Excel format before expiry</li>
                <li>• Delete completed batches to free up slots for new ones</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Batches;
