/**
 * Get color for a score value (0-100).
 * Green (low risk) -> Yellow -> Orange -> Red (high risk)
 */
export function getScoreColor(score: number): string {
  if (score <= 20) return '#22c55e'; // green
  if (score <= 35) return '#84cc16'; // lime
  if (score <= 50) return '#eab308'; // yellow
  if (score <= 65) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Get risk label for a score value
 */
export function getRiskLabel(score: number): string {
  if (score <= 20) return 'Low Risk';
  if (score <= 35) return 'Moderate';
  if (score <= 50) return 'Elevated';
  if (score <= 65) return 'High Risk';
  return 'Critical';
}

/**
 * Get trend icon
 */
export function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'improving': return '↗';
    case 'worsening': return '↘';
    default: return '→';
  }
}

export function getTrendColor(trend: string): string {
  switch (trend) {
    case 'improving': return '#22c55e';
    case 'worsening': return '#ef4444';
    default: return '#94a3b8';
  }
}
