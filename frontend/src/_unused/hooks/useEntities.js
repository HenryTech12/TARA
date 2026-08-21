import { useQuery } from '@tanstack/react-query'
import { entitiesApi } from '@/api/entities'
import { deriveRiskLevel } from '@/utils/risk'

// Maps backend entity shape → what components expect
export function normaliseEntity(e) {
  const riskScore = parseFloat(e.risk_score ?? e.riskScore ?? 0)
  return {
    ...e,
    canonicalName: e.full_name ?? e.canonicalName ?? e.id,
    entityType: (e.entity_type ?? e.entityType ?? '').toUpperCase(),
    riskScore,
    riskLevel: deriveRiskLevel(riskScore),
    linkedAlerts: e.linkedAlerts ?? [],
    createdAt: e.created_at ?? e.createdAt,
    neighbors: e.neighbors ?? [],
  }
}

function extractRiskFields(risk) {
  const rawScore = parseFloat(risk?.risk_score ?? risk?.riskScore ?? 0)
  const riskScore = Number.isFinite(rawScore) ? rawScore : 0
  return {
    riskScore,
    riskLevel: deriveRiskLevel(riskScore),
    linkedAlerts: risk?.contributing_alert_ids ?? risk?.contributingAlertIds ?? [],
  }
}

// used by entity detail page only
export function useEntities() {
  return useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const data = await entitiesApi.getAll()
      const items = data.items ?? data
      if (!Array.isArray(items)) return []
      return items.map(normaliseEntity)
    },
    staleTime: 60_000,
  })
}

export function useEntity(id) {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: async () => {
      const [data, risk] = await Promise.all([
        entitiesApi.getById(id),
        entitiesApi.getRisk(id).catch(() => null),
      ])
      const entity = normaliseEntity(data)
      if (!risk) return entity
      return { ...entity, ...extractRiskFields(risk) }
    },
    enabled: !!id,
  })
}

export function useEntityTotal() {
  return useQuery({
    queryKey: ['entity-total'],
    queryFn: async () => {
      const data = await entitiesApi.getAll(1, 0)
      return data.total ?? 0
    },
    staleTime: 60_000,
  })
}

export function useEntityRisk(id) {
  return useQuery({
    queryKey: ['entity-risk', id],
    queryFn: () => entitiesApi.getRisk(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

// Server-side search — only fires when q has content
export function useEntitySearch(q) {
  return useQuery({
    queryKey: ['entities-search', q],
    queryFn: async () => {
      const data = await entitiesApi.getAll(50, 0, q)
      const items = data.items ?? data
      if (!Array.isArray(items)) return []
      return items.map(normaliseEntity)
    },
    enabled: !!q && q.trim().length >= 2,
    staleTime: 30_000,
  })
}
