import { apiClient } from './client'

export const jobsApi = {
  getById: (jobId) =>
    apiClient.get(`/jobs/${jobId}`).then((r) => r.data),
}
