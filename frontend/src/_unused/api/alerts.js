import { apiClient } from './client'

export const alertsApi = {
  getAll: (limit = 500, status = null) => {
    const params = new URLSearchParams({ limit })
    if (status) params.set('status', status)
    return apiClient.get(`/alerts?${params}`).then((r) => r.data)
  },
  getById: (id) =>
    apiClient.get(`/alerts/${id}`).then((r) => r.data),
}
