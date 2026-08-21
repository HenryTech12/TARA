// Maps TARA's three-state verdict to the app's existing HIGH/MEDIUM/LOW risk
// color tokens (utils/riskColors.js), and to the UI copy the PRD requires —
// REJECT_REVIEW is never shown as "Reject" since nothing is ever auto-rejected.
const VERDICT_CONFIG = {
  APPROVE: { riskLevel: 'LOW', label: 'Approved' },
  REVIEW: { riskLevel: 'MEDIUM', label: 'Review' },
  REJECT_REVIEW: { riskLevel: 'HIGH', label: 'Needs Review' },
}

export function verdictToRiskLevel(verdict) {
  return VERDICT_CONFIG[verdict]?.riskLevel ?? 'NONE'
}

export function verdictLabel(verdict) {
  return VERDICT_CONFIG[verdict]?.label ?? 'Unknown'
}
