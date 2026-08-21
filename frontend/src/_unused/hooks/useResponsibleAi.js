import { useQuery } from '@tanstack/react-query'
import { responsibleAiApi } from '../api/responsibleAi'

export function useResponsibleAiMetrics() {
  return useQuery({
    queryKey: ['responsibleAi', 'metrics'],
    queryFn: responsibleAiApi.getMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
