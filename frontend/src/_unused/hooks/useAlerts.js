import { useQuery } from '@tanstack/react-query'
import { alertsApi } from '@/api/alerts'
import { deriveRiskLevel } from '@/utils/risk'

export function normaliseAlert(a) {
  const riskScore = parseFloat(a.risk_score ?? a.riskScore ?? 0)
  const entityIds = a.entity_ids ?? a.entityIds ?? []
  const transactionIds = a.transaction_ids ?? a.transactionIds ?? []
  return {
    ...a,
    riskScore,
    riskLevel: deriveRiskLevel(riskScore),
    patternType: a.pattern_type ?? a.patternType,
    entityIds,
    transactionIds,
    // Derived display fields
    entityCount: entityIds.length,
    totalVolume: parseFloat(a.total_volume ?? a.totalVolume ?? 0),
    detectedAt: a.created_at ?? a.detectedAt,
    status: (a.status ?? 'open').toUpperCase(),
    subgraphJson: a.subgraph_json ?? a.subgraphJson ?? {},
    anomalyScore: parseFloat(a.anomaly_score ?? 0),
    anomalyConfidence: parseFloat(a.anomaly_confidence ?? 0),
    anomalyFlag: a.anomaly_flag ?? false,
    reason: a.reason ?? '',
  }
}

export function useAlerts(status = null) {
  return useQuery({
    queryKey: ['alerts', status],
    queryFn: async () => {
      const data = await alertsApi.getAll(500, status)
      const items = data.alerts ?? data.items ?? data
      return Array.isArray(items) ? items.map(normaliseAlert) : []
    },
    staleTime: 30_000,
    refetchInterval: 15_000,
  })
}

export function useAlert(id) {
  return useQuery({
    queryKey: ['alert', id],
    queryFn: async () => {
      const data = await alertsApi.getById(id)
      return normaliseAlert(data)
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}
