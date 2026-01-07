import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { CreditCard, ArrowUpCircle, ArrowDownCircle, Calendar, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { Card, Button, Badge, StatCard } from '../components/ui';

export default function Credits() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, earned, spent
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, historyData] = await Promise.all([
        authAPI.me(),
        authAPI.getCreditHistory(50)
      ]);

      setUser(userData);
      setCreditHistory(historyData.transactions || []);
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

  const filteredTransactions = creditHistory.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'earned') return transaction.amount > 0;
    if (filter === 'spent') return transaction.amount < 0;
    return true;
  });

  const stats = {
    totalEarned: creditHistory.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    totalSpent: Math.abs(creditHistory.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
    transactionCount: creditHistory.length
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={logout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
        activePath="/credits"
      />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader user={user} onLogout={logout} title="Credits & Billing" />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Credits & Billing</h1>
                <p className="text-gray-600 mt-1">Manage your credits and view transaction history.</p>
              </div>
              <div className="bg-primary-50 px-4 py-2 rounded-lg flex items-center gap-2 border border-primary-100">
                <CreditCard className="text-primary-600" size={20} />
                <span className="font-bold text-primary-900 text-lg">{user?.credits || 0} Credits Available</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Total Earned"
                value={`+${stats.totalEarned}`}
                icon={<ArrowUpCircle size={24} />}
                color="success"
                trend={{ label: 'Lifetime earned', value: '', isPositive: true }}
              />
              <StatCard
                label="Total Spent"
                value={stats.totalSpent}
                icon={<ArrowDownCircle size={24} />}
                color="error"
                trend={{ label: 'Lifetime usage', value: '', isPositive: false }}
              />
              <StatCard
                label="Total Transactions"
                value={stats.transactionCount}
                icon={<TrendingUp size={24} />}
                color="secondary"
              />
            </div>

            {/* Buy Credits Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
              <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Refill your balance</h2>
                  <p className="text-indigo-100 mb-6">Choose a package that suits your volume. Credits never expire.</p>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { credits: 10, price: '$5' },
                      { credits: 50, price: '$20' },
                      { credits: 100, price: '$35' }
                    ].map(pkg => (
                      <div key={pkg.credits} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 min-w-[120px]">
                        <p className="text-xs text-indigo-100 uppercase font-semibold">Starter</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">{pkg.credits}</span>
                          <span className="text-sm">credits</span>
                        </div>
                        <p className="text-lg font-bold text-white mt-1">{pkg.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Button
                    variant="white"
                    size="lg"
                    onClick={() => alert('Stripe/Razorpay integration coming soon!')}
                    icon={<DollarSign size={20} />}
                    className="shadow-xl"
                  >
                    Buy Credits
                  </Button>
                </div>
              </div>
            </div>

            {/* History */}
            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
                <div className="flex gap-2">
                  {['all', 'earned', 'spent'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f
                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900">No transactions found</p>
                  <p className="text-sm mt-1">Your history involves {filter} transactions.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredTransactions.map((t) => (
                    <div key={t.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full ${t.amount > 0 ? 'bg-success-100 text-success-600' : 'bg-red-100 text-red-600'}`}>
                          {t.amount > 0 ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{t.reason || 'Transaction'}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <Calendar size={12} />
                            {new Date(t.timestamp).toLocaleDateString()} at {new Date(t.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className={`text-right font-bold ${t.amount > 0 ? 'text-success-600' : 'text-red-600'}`}>
                        {t.amount > 0 ? '+' : ''}{t.amount}
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
