import { create } from 'zustand'

// Carries the result of a live simulation across navigation to GraphExplorer
export const useSimulationStore = create((set) => ({
  // The entity ID to highlight in the graph after simulation
  highlightedNodeId: null,
  // Full trust score payload from GET /entities/{id}/risk
  trustScore: null,
  // The alert that was triggered (if any)
  triggeredAlert: null,

  setSimulationResult: ({ highlightedNodeId, trustScore, triggeredAlert }) =>
    set({ highlightedNodeId, trustScore, triggeredAlert }),

  clearSimulation: () =>
    set({ highlightedNodeId: null, trustScore: null, triggeredAlert: null }),
}))
