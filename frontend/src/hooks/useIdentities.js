import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { identitiesApi } from '@/api/identities'

export function useVerdict(identityId) {
  return useQuery({
    queryKey: ['verdict', identityId],
    queryFn: () => identitiesApi.getVerdict(identityId),
    enabled: !!identityId,
    staleTime: 30_000,
  })
}

export function useVerifyIdentity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => identitiesApi.verify(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] })
    },
  })
}
