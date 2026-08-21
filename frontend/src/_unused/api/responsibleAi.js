import { apiClient } from './client'

export const responsibleAiApi = {
  getMetrics: () =>
    apiClient.get('/responsible-ai/metrics').then((r) => r.data),
}
