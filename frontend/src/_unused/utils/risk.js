export function deriveRiskLevel(score) {
  const n = parseFloat(score)
  if (n >= 0.7) return 'HIGH'
  if (n >= 0.4) return 'MEDIUM'
  return 'LOW'
}

export function riskColor(score) {
  const level = deriveRiskLevel(score)
  if (level === 'HIGH') return '#ef4444'
  if (level === 'MEDIUM') return '#f59e0b'
  return '#22c55e'
}
