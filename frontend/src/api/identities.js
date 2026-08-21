import { apiClient } from './client'

// Response shape for POST /identities/verify:
// { status: 'verified' | 'rejected', identity_id, qoreid_raw, reason }
// Response shape for GET /verdict/{id}:
// { identity_id, trust_score, verdict, evidence: [], explanation }
export const identitiesApi = {
  verify: (payload) => apiClient.post('/identities/verify', payload).then((r) => r.data),
  getVerdict: (identityId) => apiClient.get(`/verdict/${identityId}`).then((r) => r.data),
}
