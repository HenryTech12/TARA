import { apiClient } from './client'

export const graphApi = {
  getFullGraph: () => apiClient.get('/graph').then((r) => r.data),
}
