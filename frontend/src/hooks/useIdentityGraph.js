import { useQueries } from '@tanstack/react-query'
import { identitiesApi } from '@/api/identities'
import { verdictToRiskLevel } from '@/utils/verdict'
import { useGraph } from './useGraph'

// Combines GET /graph with a per-node GET /verdict/{id} fetch (there is no
// batch-verdict endpoint) to drive both the graph explorer's node coloring
// and the dashboard's aggregate stat cards from one source of truth.
export function useIdentityGraph() {
  const { data: graphData, isLoading: graphLoading, isError, error } = useGraph()
  const nodeIds = graphData?.nodes?.map((n) => n.id) ?? []

  const verdictQueries = useQueries({
    queries: nodeIds.map((id) => ({
      queryKey: ['verdict', id],
      queryFn: () => identitiesApi.getVerdict(id),
      staleTime: 30_000,
      enabled: !!id,
    })),
  })

  const verdictById = new Map(
    nodeIds.map((id, i) => [id, verdictQueries[i]?.data]).filter(([, v]) => v)
  )

  const nodes = (graphData?.nodes ?? []).map((n) => {
    const verdict = verdictById.get(n.id)
    return {
      ...n,
      label: n.label ?? n.id,
      risk: verdict ? verdictToRiskLevel(verdict.verdict) : 'NONE',
      trustScore: verdict?.trust_score ?? null,
      verdict: verdict?.verdict ?? null,
    }
  })

  const nodeIdSet = new Set(nodes.map((n) => n.id))
  const links = (graphData?.links ?? [])
    .filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))
    .map((l) => ({
      source: l.source,
      target: l.target,
      attribute_type: l.attribute_type,
      attribute_value: l.attribute_value,
    }))

  const verdictsLoading = verdictQueries.some((q) => q.isLoading)

  return {
    nodes,
    links,
    verdictById,
    isLoading: graphLoading,
    verdictsLoading,
    isError,
    error,
  }
}
