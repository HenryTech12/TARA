import { useQuery } from '@tanstack/react-query'
import { graphApi } from '@/api/graph'

export function useGraph() {
  return useQuery({
    queryKey: ['graph'],
    queryFn: graphApi.getFullGraph,
    staleTime: 60_000,
  })
}
