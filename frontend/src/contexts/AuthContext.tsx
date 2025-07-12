import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TaxSettings } from '@/lib/api/usersApi'

interface User {
  id: string
  email: string
  name: string
  createdAt: string
  preferences: {
    language: string
    currency: string
    theme: string
    taxSettings?: TaxSettings
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const isAuthenticated = !!user

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('auth_token')
    if (token) {
      // Validate token and get user data
      validateSession(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  const validateSession = async (token: string) => {
    try {
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const responseData = await response.json()
        // Backend returns { valid: true, user: userData }, so we need the user property
        if (responseData.valid && responseData.user) {
          setUser(responseData.user)
        } else {
          localStorage.removeItem('auth_token')
        }
      } else {
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Session validation failed:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const { user, access_token } = await response.json()
        localStorage.setItem('auth_token', access_token)
        setUser(user)
        navigate('/dashboard')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }
    } catch (error) {
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        const { user, access_token } = await response.json()
        localStorage.setItem('auth_token', access_token)
        setUser(user)
        navigate('/dashboard')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    navigate('/login')
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 