/**
 * Button Component
 * Reusable button with multiple variants and sizes
 * 
 * Usage:
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </Button>
 */

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg active:scale-95';

  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-button hover:shadow-button-hover',
    secondary: 'bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white shadow-button hover:shadow-button-hover',
    success: 'bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white shadow-button hover:shadow-button-hover',
    warning: 'bg-gradient-to-r from-warning-600 to-warning-700 hover:from-warning-700 hover:to-warning-800 text-white shadow-button hover:shadow-button-hover',
    error: 'bg-gradient-to-r from-error-600 to-error-700 hover:from-error-700 hover:to-error-800 text-white shadow-button hover:shadow-button-hover',
    outline: 'border-2 border-gray-300 hover:border-primary-500 text-gray-700 hover:text-primary-700 hover:bg-primary-50',
    ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  // Adapt spinner color based on button variant
  const isLight = variant === 'outline' || variant === 'ghost';
  const spinnerClass = isLight ? 'border-gray-500/30 border-t-gray-600' : 'border-white/30 border-t-white';

  return (
    <button
      className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className={`w-4 h-4 border-2 rounded-full animate-spin ${spinnerClass}`} />
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}
