import { useEntityRisk } from '@/hooks/useEntities'
import { useAlerts } from '@/hooks/useAlerts'
import { Spinner } from '@/components/ui/Spinner'

function getTrustLevel(score) {
  const n = parseFloat(score)
  if (n >= 0.7) return { level: 'HIGH RISK', color: 'red', icon: '🛡️', bgClass: 'bg-red-500/20', borderClass: 'border-red-500/50', textClass: 'text-red-400' }
  if (n >= 0.4) return { level: 'FLAGGED', color: 'amber', icon: '⚠️', bgClass: 'bg-amber-500/20', borderClass: 'border-amber-500/50', textClass: 'text-amber-400' }
  return { level: 'VERIFIED', color: 'green', icon: '✓', bgClass: 'bg-green-500/20', borderClass: 'border-green-500/50', textClass: 'text-green-400' }
}

export function EntityTrustScoreCard({ entityId }) {
  const { data: risk, isLoading } = useEntityRisk(entityId)
  const { data: alerts } = useAlerts()

  if (isLoading) {
    return (
      <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-6 flex justify-center">
        <Spinner />
      </div>
    )
  }

  const riskScore = parseFloat(risk?.risk_score ?? risk?.riskScore ?? 0)
  const trust = getTrustLevel(riskScore)
  const linkedAlerts = (alerts ?? []).filter(a => a.entityIds?.includes(entityId) && a.status === 'OPEN')
  const highRiskConnections = risk?.high_risk_connections ?? risk?.highRiskConnections ?? 0
  const anomalyFlag = risk?.anomaly_flag ?? risk?.anomalyFlag ?? false
  const lastUpdated = risk?.updated_at ?? risk?.updatedAt ?? new Date().toISOString()

  const evidencePoints = []
  if (linkedAlerts.length > 0) {
    const firstAlert = linkedAlerts[0]
    const patternLabel = firstAlert.patternType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? 'Pattern'
    evidencePoints.push(`${patternLabel} confirmed`)
  }
  if (highRiskConnections > 0) {
    evidencePoints.push(`Connected to ${highRiskConnections} HIGH RISK ${highRiskConnections === 1 ? 'entity' : 'entities'}`)
  }
  if (anomalyFlag) {
    evidencePoints.push('Flagged by anomaly detection model')
  }
  if (evidencePoints.length === 0) {
    evidencePoints.push('No suspicious patterns detected')
  }

  return (
    <div className={`bg-[#111827] border-2 ${trust.borderClass} rounded-lg p-6 mb-4`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`${trust.bgClass} ${trust.borderClass} border-2 rounded-lg px-4 py-3 flex items-center gap-2`}>
            <span className="text-2xl">{trust.icon}</span>
            <span className={`text-lg font-bold ${trust.textClass} uppercase tracking-wide`}>{trust.level}</span>
          </div>
          <div>
            <p className={`text-4xl font-bold font-mono ${trust.textClass}`}>{(riskScore * 100).toFixed(1)}%</p>
            <p className="text-xs text-[#4B5563] mt-1">Trust Score</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-[#4B5563] uppercase tracking-wider mb-2">Evidence Summary</p>
        <ul className="space-y-1.5">
          {evidencePoints.slice(0, 3).map((point, i) => (
            <li key={i} className="text-sm text-[#94A3B8] flex items-start gap-2">
              <span className="text-[#00D4AA] mt-0.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3 text-xs text-[#4B5563]">
        <span>Last updated: {new Date(lastUpdated).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        <span>·</span>
        <span>{linkedAlerts.length} open {linkedAlerts.length === 1 ? 'alert' : 'alerts'}</span>
        <span>·</span>
        <span>TARA Trust Score</span>
      </div>
    </div>
  )
}
