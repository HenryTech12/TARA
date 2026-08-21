import { apiClient } from './client'

export const strApi = {
  getAll: () =>
    apiClient.get('/str/list').then((r) => r.data),
  getById: (id) =>
    apiClient.get(`/str/${id}`).then((r) => r.data),
  generate: (alertId, reportingPeriodStart = null, reportingPeriodEnd = null, reviewerNotes = null) =>
    apiClient.post('/str/generate', {
      alert_id: alertId,
      ...(reportingPeriodStart ? { reporting_period_start: reportingPeriodStart } : {}),
      ...(reportingPeriodEnd ? { reporting_period_end: reportingPeriodEnd } : {}),
      ...(reviewerNotes ? { reviewer_notes: reviewerNotes } : {}),
    }).then((r) => r.data),
  updateDecision: (id, decision, reviewerNotes = null) =>
    apiClient.patch(`/str/${id}/decision`, {
      decision,
      ...(reviewerNotes ? { reviewer_notes: reviewerNotes } : {}),
    }).then((r) => r.data),
  file: (id) =>
    apiClient.post(`/str/${id}/file`).then((r) => r.data),
}
