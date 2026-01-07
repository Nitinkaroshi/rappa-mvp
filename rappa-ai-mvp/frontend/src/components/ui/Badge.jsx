/**
 * Badge Component
 * Status badges with semantic colors
 * 
 * Usage:
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error" size="sm">Error</Badge>
 */

export default function Badge({
    children,
    variant = 'neutral',
    size = 'md',
    icon,
    className = '',
    ...props
}) {
    const baseClasses = 'inline-flex items-center gap-1.5 rounded-full font-semibold border backdrop-blur-sm';

    const variants = {
        success: 'bg-success-100 text-success-700 border-success-200',
        warning: 'bg-warning-100 text-warning-700 border-warning-200',
        error: 'bg-error-100 text-error-700 border-error-200',
        info: 'bg-info-100 text-info-700 border-info-200',
        primary: 'bg-primary-100 text-primary-700 border-primary-200',
        secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200',
        neutral: 'bg-gray-100 text-gray-700 border-gray-200',
        white: 'bg-white text-gray-900 border-white/50 shadow-sm',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    const variantClass = variants[variant] || variants.neutral;
    const sizeClass = sizes[size] || sizes.md;

    return (
        <span
            className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
            {...props}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </span>
    );
}
