import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api/audit'

export function normaliseAuditEntry(e) {
  return {
    id: e.id ?? `${e.action}-${e.created_at}`,
    action: (e.action ?? '').toUpperCase(),
    target: e.entity_id ?? e.alert_id ?? e.str_id ?? e.target ?? '—',
    targetType: e.entity_id ? 'Entity' : e.alert_id ? 'Alert' : e.str_id ? 'STR' : (e.target_type ?? '—'),
    user: e.actor ?? e.user ?? 'System',
    timestamp: e.created_at ?? e.timestamp,
    hash: e.payload_hash ?? e.hash ?? '—',
    verified: !!(e.payload_hash ?? e.hash),
    metadata: e.metadata ?? {},
  }
}

export function useAuditLog(action = null) {
  return useQuery({
    queryKey: ['audit', action],
    queryFn: async () => {
      const data = await auditApi.getAll(200, action)
      const items = data.items ?? data.entries ?? data
      return Array.isArray(items) ? items.map(normaliseAuditEntry) : []
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}
