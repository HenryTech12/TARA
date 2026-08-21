import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('tara_token'),
  isAuthenticated: !!localStorage.getItem('tara_token'),

  login: (user, token) => {
    localStorage.setItem('tara_token', token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('tara_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
