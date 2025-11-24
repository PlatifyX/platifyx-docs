import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { mockUser, mockToken, mockLogin, mockLogout, mockCheckAuth } from '../mocks/data/auth'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      // Usando dados mockados
      const data = await mockCheckAuth()
      setUser(data.user)
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // Usando dados mockados
      const data = await mockLogin(email, password)
      localStorage.setItem('token', data.token)
      setUser(data.user)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      // Usando dados mockados
      await mockLogout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
