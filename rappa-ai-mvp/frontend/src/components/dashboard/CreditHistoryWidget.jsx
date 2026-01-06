import { CreditCard, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';

export default function CreditHistoryWidget({ transactions = [] }) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <History size={20} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
        </div>
      </div>

      <div className="p-6">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {transaction.amount > 0 ? (
                    <ArrowUpCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <ArrowDownCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 break-words">
                      {transaction.reason}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold flex-shrink-0 ml-2 ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
