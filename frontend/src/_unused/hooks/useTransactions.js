import { useQuery } from '@tanstack/react-query'
import { transactionsApi } from '@/api/transactions'

function normaliseTransaction(t) {
  return {
    ...t,
    fromEntity: t.fromEntity ?? t.from_entity_id ?? t.source_entity_id ?? '—',
    toEntity: t.toEntity ?? t.to_entity_id ?? t.destination_entity_id ?? '—',
    fromEntityName: t.from_entity_name ?? t.fromEntityName ?? null,
    toEntityName: t.to_entity_name ?? t.toEntityName ?? null,
    amount: parseFloat(t.amount ?? 0),
    channel: t.channel ?? '—',
    date: t.date ?? t.occurred_at ?? t.created_at,
  }
}

export function useRecentTransactions(limit = 20) {
  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: async () => {
      const data = await transactionsApi.getRecent(limit)
      return (Array.isArray(data) ? data : []).map(normaliseTransaction)
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}

export function useTransactionsByAlert(alertId) {
  return useQuery({
    queryKey: ['transactions', 'alert', alertId],
    queryFn: async () => {
      const data = await transactionsApi.getByAlert(alertId)
      return (Array.isArray(data) ? data : []).map(normaliseTransaction)
    },
    enabled: !!alertId,
    staleTime: 30_000,
  })
}

export function useTransactionsByEntity(entityId) {
  return useQuery({
    queryKey: ['transactions', 'entity', entityId],
    queryFn: async () => {
      const data = await transactionsApi.getByEntity(entityId)
      return (Array.isArray(data) ? data : []).map(normaliseTransaction)
    },
    enabled: !!entityId,
    staleTime: 30_000,
  })
}
