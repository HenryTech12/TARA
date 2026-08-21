export { apiClient } from './client'
export { graphApi } from './graph'
export { identitiesApi } from './identities'

// VERA's financial-domain API modules (entities, alerts, str, transactions,
// agent, jobs, responsibleAi, audit, squad) call backend routes that no
// longer exist in TARA — left on disk, unexported here, per PRD Section 01.
