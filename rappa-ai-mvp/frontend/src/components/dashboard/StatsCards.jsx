import { FileText, Clock, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import StatCard from '../ui/StatCard';

export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'Total Documents',
      value: stats.total.toLocaleString(),
      icon: <FileText size={20} />,
      variant: 'primary',
      trend: null,
    },
    {
      label: 'Pending',
      value: (stats.queued + stats.processing).toLocaleString(),
      icon: <Clock size={20} />,
      variant: 'warning',
      trend: stats.queued + stats.processing > 0 ? `${stats.processing} processing` : null,
    },
    {
      label: 'Completed',
      value: stats.completed.toLocaleString(),
      icon: <CheckCircle size={20} />,
      variant: 'success',
      trend: stats.total > 0 ? `${((stats.completed / stats.total) * 100).toFixed(0)}% of total` : null,
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: <TrendingUp size={20} />,
      variant: stats.successRate >= 90 ? 'success' : stats.successRate >= 70 ? 'info' : 'error',
      trend: stats.failed > 0 ? `${stats.failed} failed` : 'All good!',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
      {cards.map((card, index) => (
        <div
          key={card.label}
          style={{ animationDelay: `${index * 50}ms` }}
          className="animate-slide-in-up"
        >
          <StatCard
            label={card.label}
            value={card.value}
            icon={card.icon}
            variant={card.variant}
            trend={card.trend}
          />
        </div>
      ))}
    </div>
  );
}
