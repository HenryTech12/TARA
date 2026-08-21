import { apiClient } from './client'

export const agentApi = {
  intake: (payload) => apiClient.post('/agent/intake', payload).then((r) => r.data),
}
