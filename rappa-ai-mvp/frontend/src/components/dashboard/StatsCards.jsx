import { FileText, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Total Documents',
      value: stats.total,
      icon: FileText,
      color: 'indigo',
      bgGradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      iconBg: 'bg-white',
      iconColor: 'text-indigo-600',
      textColor: 'text-white',
      borderColor: 'border-indigo-300'
    },
    {
      title: 'Pending',
      value: stats.queued + stats.processing,
      icon: Clock,
      color: 'yellow',
      bgGradient: 'bg-gradient-to-br from-yellow-500 to-amber-600',
      iconBg: 'bg-white',
      iconColor: 'text-yellow-600',
      textColor: 'text-white',
      borderColor: 'border-yellow-300'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'green',
      bgGradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconBg: 'bg-white',
      iconColor: 'text-green-600',
      textColor: 'text-white',
      borderColor: 'border-green-300'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'purple',
      bgGradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconBg: 'bg-white',
      iconColor: 'text-purple-600',
      textColor: 'text-white',
      borderColor: 'border-purple-300'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`${card.bgGradient} rounded-xl shadow-lg border ${card.borderColor} p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 transform`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/90 mb-2 uppercase tracking-wide">{card.title}</p>
                <p className={`text-4xl font-bold ${card.textColor} drop-shadow-sm`}>{card.value}</p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-xl shadow-md`}>
                <Icon size={32} className={card.iconColor} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
