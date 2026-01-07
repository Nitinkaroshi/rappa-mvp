import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI, authAPI } from '../services/api';
import TicketForm from '../components/support/TicketForm';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { Card, Button, Badge } from '../components/ui';
import { MessageCircle, Plus, Filter, Calendar, Paperclip, CheckCircle, AlertCircle } from 'lucide-react';

export default function Support() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const userData = await authAPI.me();
        setUser(userData);
        fetchTickets();
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
      }
    }
    init();
  }, [navigate]);

  useEffect(() => {
    if (user) fetchTickets();
  }, [statusFilter]);

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketsAPI.getAll(statusFilter);
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSuccess = (ticket) => {
    setShowForm(false);
    setSuccessMessage('Ticket submitted successfully! We will get back to you soon.');
    fetchTickets();
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const getStatusVariant = (status) => {
    const map = {
      open: 'info',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'neutral',
    };
    return map[status] || 'neutral';
  };

  const getPriorityVariant = (priority) => {
    const map = {
      low: 'neutral',
      medium: 'warning',
      high: 'error',
      urgent: 'error',
    };
    return map[priority] || 'neutral';
  };

  const getTypeIcon = (type) => {
    // You can expand this if needed, for now using emojis as in original or icons
    const icons = {
      bug: '🐛',
      feature_request: '💡',
      help: '❓',
      billing: '💳',
      other: '📝',
    };
    return <span className="text-xl">{icons[type] || '📝'}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
        activePath="/support"
      />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader user={user} onLogout={handleLogout} title="Support Center" />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
                <p className="text-gray-600 mt-1">Get help or report issues with our platform.</p>
              </div>
              {!showForm && (
                <Button onClick={() => setShowForm(true)} variant="primary" icon={<Plus size={18} />}>
                  Create New Ticket
                </Button>
              )}
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
                <CheckCircle size={20} />
                {successMessage}
              </div>
            )}

            {/* Ticket Form */}
            {showForm && (
              <Card className="p-6 border-primary-100 shadow-lg">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Submit a Support Ticket</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
                <TicketForm onSuccess={handleTicketSuccess} />
              </Card>
            )}

            {/* Tickets List */}
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-semibold text-gray-900">Your Tickets</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatusFilter(null)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === null ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('open')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === 'open' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setStatusFilter('resolved')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === 'resolved' ? 'bg-success-100 text-success-700 ring-1 ring-success-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-12 text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-900 font-medium">No tickets found</p>
                  <p className="text-gray-500 text-sm mt-1">Create a new ticket to get support.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="p-6 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="pt-1">{getTypeIcon(ticket.ticket_type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-base font-semibold text-gray-900">{ticket.subject}</h3>
                            <Badge variant={getStatusVariant(ticket.status)} size="sm" className="capitalize">
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getPriorityVariant(ticket.priority)} size="sm" className="capitalize border border-current bg-opacity-10">
                              {ticket.priority} Priority
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="font-mono">#{ticket.id}</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} /> {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                            {ticket.attached_file_path && (
                              <span className="flex items-center gap-1 text-primary-600">
                                <Paperclip size={12} /> Attachment
                              </span>
                            )}
                          </div>
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
