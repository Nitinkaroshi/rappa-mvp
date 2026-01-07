import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templatesAPI, authAPI } from '../services/api';
import { FileText, Search, Tag, CheckCircle, Upload, ArrowRight } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { Card, Button, Badge } from '../components/ui';

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, userData] = await Promise.all([
        templatesAPI.getAll(),
        authAPI.me()
      ]);

      setTemplates(templatesData);
      setUser(userData);
    } catch (err) {
      console.error('Error loading data:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  // Get unique categories
  const categories = ['all', ...new Set(templates.map(t => t.category))];

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Category display names
  const categoryNames = {
    'all': 'All Templates',
    'invoice': 'Invoices',
    'bank_statement': 'Bank Statements',
    'identity': 'Identity Documents',
    'purchase_order': 'Purchase Orders',
    'payroll': 'Payroll Documents',
    'sales_deed': 'Sales Deeds',
    'gift_deed': 'Gift Deeds',
    'lease': 'Lease Agreements',
    'other': 'Other'
  };

  const handleUseTemplate = (templateId) => {
    navigate(`/upload?template=${templateId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={logout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
        activePath="/templates" // Sidebar relies on window.location usually but we can force active if needed, or sidebar handles it
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader user={user} onLogout={logout} title="Templates" />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
                <p className="text-gray-600 mt-1">Select a template to fast-track your document processing.</p>
              </div>
              <Badge variant="primary" size="lg" className="self-start md:self-auto px-4 py-2">
                {templates.length} Active Templates
              </Badge>
            </div>

            {/* Search and Filter Card */}
            <Card className="p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {/* Search */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative group">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer transition-all"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {categoryNames[category] || category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-2 text-xs text-gray-500 font-medium">
                Showing {filteredTemplates.length} results
              </div>
            </Card>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} hover className="flex flex-col h-full border-t-4 border-t-transparent hover:border-t-primary-500 transition-all duration-300 group">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                          <FileText size={24} />
                        </div>
                        <Badge variant="secondary" size="sm" className="capitalize">
                          {categoryNames[template.category] || template.category}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 truncate" title={template.name}>
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                        {template.description || 'Optimized for high-accuracy extraction.'}
                      </p>

                      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-success-700 bg-success-50 w-fit px-2 py-1 rounded">
                        <CheckCircle size={14} />
                        {template.field_count} fields extracted
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <Button
                        variant="primary"
                        className="w-full justify-center group-hover:shadow-lg transition-all"
                        onClick={() => handleUseTemplate(template.id)}
                        icon={<Upload size={16} />}
                      >
                        Use Template
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                How Templates Work
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>Select a template that matches your document type for best accuracy.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>Each template is trained to recognize specific fields and layouts.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>You can verify and edit all extracted data before finalizing.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>Supports PDF, JPG, PNG, and TIFF formats up to 20MB.</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
