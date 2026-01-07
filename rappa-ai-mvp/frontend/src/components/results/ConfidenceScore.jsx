import Badge from '../ui/Badge';

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

  // Determine variant based on confidence level
  const getVariant = () => {
    if (score >= 95) return 'success';
    if (score >= 85) return 'info';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const variant = getVariant();

  // Icon indicator based on score
  const getIcon = () => {
    if (score >= 95) return '✓';
    if (score >= 85) return '●';
    if (score >= 70) return '!';
    return '✕';
  };

  return (
    <Badge variant={variant} size={size}>
      <span className="font-bold">{getIcon()}</span>
      <span>{score.toFixed(1)}%</span>
    </Badge>
  );
}
