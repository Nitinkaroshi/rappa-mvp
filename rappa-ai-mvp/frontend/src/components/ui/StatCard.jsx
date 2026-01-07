import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * StatCard Component
 * Display statistics with label and value
 * 
 * Usage:
 * <StatCard 
 *   label="Total Documents" 
 *   value="1,234" 
 *   icon={<FileText />}
 *   trend="+12%"
 *   variant="success"
 * />
 */

export default function StatCard({
    label,
    value,
    icon,
    trend,
    variant = 'neutral',
    className = '',
    ...props
}) {
    const variants = {
        success: 'border-success-200 bg-gradient-to-br from-success-50 to-white',
        warning: 'border-warning-200 bg-gradient-to-br from-warning-50 to-white',
        error: 'border-error-200 bg-gradient-to-br from-error-50 to-white',
        info: 'border-info-200 bg-gradient-to-br from-info-50 to-white',
        primary: 'border-primary-200 bg-gradient-to-br from-primary-50 to-white',
        neutral: 'border-gray-200 bg-white',
    };

    const trendColors = {
        success: 'text-success-600',
        warning: 'text-warning-600',
        error: 'text-error-600',
        info: 'text-info-600',
        primary: 'text-primary-600',
        neutral: 'text-gray-600',
    };

    const variantClass = variants[variant] || variants.neutral;
    const trendColor = trendColors[variant] || trendColors.neutral;

    return (
        <div
            className={`rounded-xl p-6 shadow-card border hover:shadow-card-hover transition-shadow duration-200 ${variantClass} ${className}`}
            {...props}
        >
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">{label}</p>
                {icon && (
                    <div className={`p-2 rounded-lg ${variant === 'neutral' ? 'bg-gray-100' : `bg-${variant}-100`}`}>
                        {icon}
                    </div>
                )}
            </div>
            <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${typeof trend === 'string'
                            ? trendColor
                            : trend.isPositive ? 'text-success-600' : 'text-error-600'
                        }`}>
                        {typeof trend === 'object' ? (
                            <>
                                {trend.isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                <span>{trend.label} {trend.value}</span>
                            </>
                        ) : (
                            trend
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
