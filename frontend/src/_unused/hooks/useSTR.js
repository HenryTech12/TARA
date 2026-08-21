import { useQuery } from '@tanstack/react-query'
import { strApi } from '@/api/str'

export function normaliseSTR(s) {
  const decision = (s.decision ?? 'pending').toLowerCase()
  return {
    ...s,
    // Normalised status for UI (uppercased decision)
    status: decision.toUpperCase(),
    // Convenience flag — pending means awaiting human review
    isPending: decision === 'pending',
    alertId: s.alert_id ?? s.alertId,
    draftContent: s.content_text ?? s.draftContent ?? '',
    contentJson: s.content_json ?? s.contentJson ?? {},
    provider: s.provider ?? '—',
    modelName: s.model_name ?? s.modelName ?? '—',
    modelVersion: s.model_version ?? s.modelVersion ?? '—',
    reviewerNotes: s.reviewer_notes ?? s.reviewerNotes ?? '',
    payloadHash: s.payload_hash ?? s.payloadHash ?? '',
    squadRef: s.content_json?.squad_transaction_ref ?? null,
    createdAt: s.created_at ?? s.createdAt,
    updatedAt: s.updated_at ?? s.updatedAt ?? s.created_at,
  }
}

export function useSTRs(statusFilter = null) {
  return useQuery({
    queryKey: ['strs', statusFilter],
    queryFn: async () => {
      const data = await strApi.getAll(500)
      const items = data.strs ?? data.items ?? data
      const all = Array.isArray(items) ? items.map(normaliseSTR) : []
      if (!statusFilter) return all
      return all.filter((s) => s.status === statusFilter.toUpperCase())
    },
    staleTime: 30_000,
  })
}

export function useSTR(id) {
  return useQuery({
    queryKey: ['str', id],
    queryFn: async () => normaliseSTR(await strApi.getById(id)),
    enabled: !!id,
    staleTime: 30_000,
  })
}
