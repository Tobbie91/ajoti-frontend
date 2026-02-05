import { ReactNode, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '@/utils/auth'
import type { User } from '@/utils/auth'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Restore user from local storage on refresh.
    const storedUser = localStorage.getItem('user')
    if (!storedUser) return
    try {
      const parsed = JSON.parse(storedUser) as User
      if (parsed?.email) {
        setUser(parsed)
      }
    } catch {
      localStorage.removeItem('user')
    }
  }, [])

  const login = useCallback(
    async (credential: string) => {
      setIsLoading(true)
      try {
        // Decode the Google ID token to populate the user profile.
        // Decode JWT token to get user info
        const base64Url = credential.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const payload = JSON.parse(jsonPayload)

        const userData: User = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        }

        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        navigate('/home')
      } catch (error) {
        console.error('Login failed:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [navigate]
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
    navigate('/')
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

