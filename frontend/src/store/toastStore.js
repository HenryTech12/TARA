import { create } from 'zustand'

let nextId = 0

export const useToastStore = create((set) => ({
  toasts: [],
  add: (message, type = 'success') => {
    const id = ++nextId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3500)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (msg) => useToastStore.getState().add(msg, 'success'),
  error: (msg) => useToastStore.getState().add(msg, 'error'),
  info: (msg) => useToastStore.getState().add(msg, 'info'),
}
