import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authAPI, processingAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatsCards from '../components/dashboard/StatsCards';
import JobsTable from '../components/dashboard/JobsTable';
import ActivitySidebar from '../components/dashboard/ActivitySidebar';
import SearchBar from '../components/search/SearchBar';
import FilterPanel from '../components/search/FilterPanel';
import Pagination from '../components/common/Pagination';
import AccountingExportModal from '../components/accounting/AccountingExportModal';
import { useSearch } from '../hooks/useSearch';
import { useFilter } from '../hooks/useFilter';
import { usePagination } from '../hooks/usePagination';
import { Download } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [showBatchExport, setShowBatchExport] = useState(false);

  // React Query: Fetch user data
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => authAPI.me(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    onError: (error) => {
      if (error.response?.status === 401) navigate('/login');
    },
  });

  // React Query: Fetch jobs with auto-refetch every 5 seconds
  const { data: jobsData, isLoading: loading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => processingAPI.getJobs({ limit: 50 }),
    staleTime: 0, // Always refetch
    refetchInterval: 5000, // Auto-refetch every 5 seconds
    refetchIntervalInBackground: true,
  });

  const jobs = Array.isArray(jobsData) ? jobsData : jobsData?.jobs || [];

  // Phase 2: Search, Filter, Pagination
  const { searchTerm, setSearchTerm, filteredItems: searchedJobs, isSearching } = useSearch(
    jobs,
    ['filename', 'status', 'document_type', 'id']
  );

  const { filters, filteredItems: filteredJobs, updateFilter, clearFilters, hasActiveFilters } = useFilter(searchedJobs);

  const pagination = usePagination(filteredJobs, 20);

  const logout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  const viewJobResults = (job) => {
    navigate(`/jobs/${job.id}`);
  };

  // Calculate stats
  const stats = {
    total: jobs.length,
    queued: jobs.filter(j => j.status === 'queued').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    successRate: jobs.length > 0 ? ((jobs.filter(j => j.status === 'completed').length / jobs.length) * 100).toFixed(1) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching your latest documents</p>
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
        className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
          title="Dashboard"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Search and Filter */}
            <div className="space-y-4">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search jobs by filename, status, or ID..."
                isSearching={isSearching}
              />

              <FilterPanel
                filters={filters}
                updateFilter={updateFilter}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            {/* Results Info */}
            {(searchTerm || hasActiveFilters) && (
              <div className="text-sm text-gray-600">
                Showing {filteredJobs.length} of {jobs.length} jobs
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            )}

            {/* Batch Export Button */}
            {selectedJobIds.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="text-indigo-600" size={20} />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedJobIds.length} job{selectedJobIds.length > 1 ? 's' : ''} selected
                      </h3>
                      <p className="text-sm text-gray-600">
                        Export selected jobs to accounting software
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBatchExport(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
                  >
                    <Download size={18} />
                    Export to Accounting Software
                  </button>
                </div>
              </div>
            )}

            {/* Jobs Table - Paginated */}
            <JobsTable
              jobs={pagination.paginatedItems}
              onViewResults={viewJobResults}
              onActivityClick={() => setActivitySidebarOpen(true)}
              selectedJobs={selectedJobIds}
              onSelectionChange={setSelectedJobIds}
            />

            {/* Pagination */}
            {filteredJobs.length > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.changePageSize}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                hasNextPage={pagination.hasNextPage}
                hasPreviousPage={pagination.hasPreviousPage}
              />
            )}
          </div>
        </main>
      </div>

      {/* Activity Sidebar */}
      <ActivitySidebar
        jobs={jobs}
        isOpen={activitySidebarOpen}
        onClose={() => setActivitySidebarOpen(false)}
      />

      {/* Batch Export Modal */}
      {showBatchExport && (
        <AccountingExportModal
          jobIds={selectedJobIds}
          onClose={() => {
            setShowBatchExport(false);
            setSelectedJobIds([]);
          }}
        />
      )}
    </div>
  );
}
