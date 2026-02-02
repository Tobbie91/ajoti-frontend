import { createContext, useContext } from 'react'

export interface User {
  id: string
  email: string
  name: string
  picture?: string
}

export interface AuthContextType {
  user: User | null
  login: (credential: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
