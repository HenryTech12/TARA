import { apiClient } from './client'

export const entitiesApi = {
  getAll: (limit = 200, offset = 0, q = '') => {
    const params = new URLSearchParams({ limit, offset })
    if (q) params.set('q', q)
    return apiClient.get(`/entities?${params}`).then((r) => r.data)
  },
  getById: (id) =>
    apiClient.get(`/entities/${id}`).then((r) => r.data),
  getRisk: (id) =>
    apiClient.get(`/entities/${id}/risk`).then((r) => r.data),
}
