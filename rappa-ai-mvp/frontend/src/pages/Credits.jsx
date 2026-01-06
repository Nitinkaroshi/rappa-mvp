import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { CreditCard, ArrowLeft, ArrowUpCircle, ArrowDownCircle, Calendar, DollarSign, TrendingUp } from 'lucide-react';

export default function Credits() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, earned, spent

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

  // Filter transactions
  const filteredTransactions = creditHistory.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'earned') return transaction.amount > 0;
    if (filter === 'spent') return transaction.amount < 0;
    return true;
  });

  // Calculate stats
  const stats = {
    totalEarned: creditHistory
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    totalSpent: Math.abs(
      creditHistory
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    ),
    transactionCount: creditHistory.length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">rappa.ai</h1>
          <div className="flex items-center gap-6">
            <span className="text-gray-700">{user?.email}</span>
            <div className="flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-lg">
              <CreditCard size={18} className="text-indigo-600" />
              <span className="font-semibold text-indigo-900">{user?.credits} credits</span>
            </div>
            <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
            <button onClick={logout} className="text-gray-600 hover:text-gray-900">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Credits & Billing</h2>
          <p className="text-gray-600">Manage your credits and view transaction history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Current Balance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Current Balance</p>
              <CreditCard size={24} className="text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-indigo-600">{user?.credits}</p>
            <p className="text-xs text-gray-500 mt-1">Available credits</p>
          </div>

          {/* Total Earned */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Earned</p>
              <ArrowUpCircle size={24} className="text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">+{stats.totalEarned}</p>
            <p className="text-xs text-gray-500 mt-1">Credits added</p>
          </div>

          {/* Total Spent */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Spent</p>
              <ArrowDownCircle size={24} className="text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.totalSpent}</p>
            <p className="text-xs text-gray-500 mt-1">Credits used</p>
          </div>

          {/* Transactions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Transactions</p>
              <TrendingUp size={24} className="text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.transactionCount}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
        </div>

        {/* Buy Credits Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need More Credits?</h3>
              <p className="text-indigo-100 mb-4">
                Purchase credits to process more documents and unlock premium features
              </p>
              <div className="flex gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-sm text-indigo-100">10 Credits</p>
                  <p className="text-2xl font-bold">$5.00</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-sm text-indigo-100">50 Credits</p>
                  <p className="text-2xl font-bold">$20.00</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-sm text-indigo-100">100 Credits</p>
                  <p className="text-2xl font-bold">$35.00</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => alert('Payment integration coming soon!')}
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition flex items-center gap-2"
            >
              <DollarSign size={20} />
              Buy Credits
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Transaction History</h3>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({creditHistory.length})
                </button>
                <button
                  onClick={() => setFilter('earned')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'earned'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Earned ({creditHistory.filter(t => t.amount > 0).length})
                </button>
                <button
                  onClick={() => setFilter('spent')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'spent'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Spent ({creditHistory.filter(t => t.amount < 0).length})
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No transactions found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {filter === 'all'
                    ? 'Your transaction history will appear here'
                    : `No ${filter} transactions yet`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        transaction.amount > 0
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}>
                        {transaction.amount > 0 ? (
                          <ArrowUpCircle size={24} className="text-green-600" />
                        ) : (
                          <ArrowDownCircle size={24} className="text-red-600" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">{transaction.reason}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar size={14} className="text-gray-400" />
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.timestamp).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        transaction.amount > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </p>
                      <p className="text-xs text-gray-500">credits</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
