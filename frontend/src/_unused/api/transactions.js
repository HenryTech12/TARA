import { apiClient } from './client'

export const transactionsApi = {
  getRecent: (limit = 20) => apiClient.get(`/transactions/recent?limit=${limit}`).then((r) => r.data),
  getByEntity: (entityId) => apiClient.get(`/transactions?entityId=${entityId}`).then((r) => r.data),
  getByAlert: (alertId) => apiClient.get(`/transactions?alertId=${alertId}`).then((r) => r.data),
}
