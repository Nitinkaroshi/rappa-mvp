/**
 * ConfidenceIndicator Component
 *
 * Displays extraction confidence with color coding:
 * - Green (95-100%): High confidence
 * - Yellow (90-95%): Medium confidence
 * - Red (<90%): Low confidence - needs review
 */

export default function ConfidenceIndicator({ confidence, size = 'md', showPercentage = true }) {
  // Convert confidence to number if it's a string
  const getConfidenceValue = () => {
    if (typeof confidence === 'string') {
      // Handle percentage strings like "95%"
      const cleaned = confidence.replace('%', '').trim();
      return parseFloat(cleaned);
    }
    if (typeof confidence === 'number') {
      // If value is between 0-1, convert to percentage
      return confidence <= 1 ? confidence * 100 : confidence;
    }
    return 0;
  };

  const conf = getConfidenceValue();

  // Determine color based on confidence level
  const getColorScheme = (conf) => {
    if (conf >= 95) {
      return {
        bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
        text: 'text-green-800',
        dot: 'bg-green-500',
        border: 'border-green-400',
        label: 'High',
        shadow: 'shadow-sm',
      };
    }
    if (conf >= 90) {
      return {
        bg: 'bg-gradient-to-r from-yellow-100 to-amber-100',
        text: 'text-yellow-800',
        dot: 'bg-yellow-500',
        border: 'border-yellow-400',
        label: 'Medium',
        shadow: 'shadow-sm',
      };
    }
    return {
      bg: 'bg-gradient-to-r from-red-100 to-orange-100',
      text: 'text-red-800',
      dot: 'bg-red-500',
      border: 'border-red-400',
      label: 'Low',
      shadow: 'shadow-sm',
    };
  };

  const colors = getColorScheme(conf);

  // Size variants
  const sizeClasses = {
    sm: {
      container: 'px-1.5 py-0.5 text-xs',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      container: 'px-2 py-1 text-xs',
      dot: 'w-2 h-2',
    },
    lg: {
      container: 'px-3 py-1.5 text-sm',
      dot: 'w-2.5 h-2.5',
    },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border ${colors.bg} ${colors.border} ${colors.shadow} ${currentSize.container} hover:scale-105 transition-transform duration-200`}
      title={`Extraction confidence: ${conf.toFixed(1)}% (${colors.label})`}
    >
      <div className={`rounded-full ${colors.dot} ${currentSize.dot} animate-pulse`}></div>
      {showPercentage && (
        <span className={`font-bold ${colors.text}`}>
          {conf.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
