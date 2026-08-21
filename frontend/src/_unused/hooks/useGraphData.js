import { useQueries } from '@tanstack/react-query'
import { useAlerts } from '@/hooks/useAlerts'
import { entitiesApi } from '@/api/entities'
import { normaliseEntity } from '@/hooks/useEntities'
import { deriveRiskLevel } from '@/utils/risk'

export function useGraphData(filterEntityIds = null) {
  const { data: alerts = [] } = useAlerts()

  const allEntityIds = [...new Set(alerts.flatMap((a) => a.entityIds ?? []))]
  const targetIds = filterEntityIds
    ? allEntityIds.filter((id) => filterEntityIds.includes(id))
    : allEntityIds

  const entityQueries = useQueries({
    queries: targetIds.map((id) => ({
      queryKey: ['entity', id],
      queryFn: async () => normaliseEntity(await entitiesApi.getById(id)),
      staleTime: 60_000,
      enabled: !!id,
    })),
  })

  const riskQueries = useQueries({
    queries: targetIds.map((id) => ({
      queryKey: ['entity-risk', id],
      queryFn: () => entitiesApi.getRisk(id),
      staleTime: 30_000,
      enabled: !!id,
    })),
  })

  const entities = entityQueries.flatMap((q) => (q.data ? [q.data] : []))
  const riskById = new Map(
    riskQueries
      .map((q) => q.data)
      .filter(Boolean)
      .map((risk) => [risk.entity_id ?? risk.entityId, parseFloat(risk.risk_score ?? risk.riskScore ?? 0)])
  )

  const entitiesWithRisk = entities.map((entity) => {
    const rawRiskScore = riskById.has(entity.id)
      ? riskById.get(entity.id)
      : parseFloat(entity.riskScore ?? 0)
    const riskScore = Number.isFinite(rawRiskScore) ? rawRiskScore : 0

    return {
      ...entity,
      riskScore,
      riskLevel: deriveRiskLevel(riskScore),
    }
  })
  const entitySet = new Set(entitiesWithRisk.map((e) => e.id))

  const nodes = entitiesWithRisk.map((e) => ({
    id: e.id,
    label: e.canonicalName,
    type: e.entityType,
    risk: e.riskLevel,
  }))

  const linkSet = new Set()
  const links = []
  entitiesWithRisk.forEach((e) => {
    ;(e.neighbors ?? []).forEach((n) => {
      const neighborId = n.entity_id ?? n.entityId
      if (!entitySet.has(neighborId)) return
      const key = [e.id, neighborId].sort().join('--')
      if (linkSet.has(key)) return
      linkSet.add(key)
      links.push({
        source: e.id,
        target: neighborId,
        value: parseFloat(n.total_amount ?? n.totalAmount ?? 50),
      })
    })
  })

  const isLoading = entityQueries.some((q) => q.isLoading) || riskQueries.some((q) => q.isLoading)

  return { nodes, links, isLoading }
}
