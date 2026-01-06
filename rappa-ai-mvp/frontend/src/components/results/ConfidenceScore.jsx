export default function ConfidenceScore({ confidence, size = 'md' }) {
  // Convert to percentage if needed
  // Handle input: support both 0-1 (probability) and 0-100 (percentage) scales
  const parseScore = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    // If <= 1, assume 0-1 scale (unless it's 0 or 1 typically, but simple heuristic works for 0.93)
    return (num <= 1 && num > 0) ? num * 100 : num;
  };

  const score = parseScore(confidence);

  // Determine color based on confidence level
  const getColor = () => {
    if (score >= 95) return { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-600' };
    if (score >= 85) return { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-600' };
    if (score >= 70) return { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-600' };
    return { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-600' };
  };

  const colors = getColor();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${colors.bg} rounded-lg ${sizeClasses[size]} font-semibold ${colors.text}`}>
      {/* Confidence Icon/Indicator */}
      <div className={`w-2 h-2 rounded-full ${colors.ring.replace('ring-', 'bg-')}`}></div>
      <span>{score.toFixed(2)}%</span>
    </div>
  );
}
