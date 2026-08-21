import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'

export function useJob(jobId, options = {}) {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => jobsApi.getById(jobId),
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if job is still processing
      if (data?.status === 'queued' || data?.status === 'processing') {
        return 2000
      }
      return false
    },
    ...options,
  })
}
