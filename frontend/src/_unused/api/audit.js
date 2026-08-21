import { apiClient } from './client'

export const auditApi = {
  getAll: (limit = 200, action = null) => {
    const params = new URLSearchParams({ limit })
    if (action) params.set('action', action)
    return apiClient.get(`/audit-log?${params}`).then((r) => r.data)
  },
}
