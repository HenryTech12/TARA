import { create } from 'zustand'

export const useUIStore = create((set) => ({
  // On mobile the overlay sidebar starts closed (collapsed = true means hidden)
  sidebarCollapsed: true,
  notifications: 3,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  clearNotifications: () => set({ notifications: 0 }),
}))
