import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        // TODO: Implement actual API call
        // This is a mock implementation
        if (email === 'admin@example.com' && password === 'admin123') {
          const mockUser = {
            id: '1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
          }
          const mockToken = 'mock-jwt-token'
          set({ user: mockUser, token: mockToken, isAuthenticated: true })
        } else {
          throw new Error('Invalid credentials')
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
) 