import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginPayload, User } from '../types/auth'
import { API_BASE, setAuthToken } from '../utils/api'
import { login as loginService } from '../services/auth'
import { sanitizeInput } from '../utils/sanitize'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
  updateUser: (nextUser: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_TOKEN_KEY = 'talent_dashboard_token'
const STORAGE_USER_KEY = 'talent_dashboard_user'

const demoBaseUser: User = {
  id: 1,
  name: '张一鸣',
  role: 'admin',
  permissions: [
    'people.view.all',
    'people.edit.all',
    'dimensions.view.all',
    'dimensions.edit.all',
    'evaluations.view',
    'evaluations.edit',
    'growth.view.all',
    'growth.edit.all',
    'meetings.view',
    'meetings.edit',
    'certificates.view',
    'certificates.upload',
    'certificates.delete',
    'users.manage',
    'permissions.manage',
    'import.excel',
    'export.excel',
    'logs.view',
    'sensitive.view'
  ]
}

const demoAccounts: Array<{ account: string; password: string; user: User }> = [
  { account: 'admin', password: 'admin@123', user: demoBaseUser },
  {
    account: 'display',
    password: 'display@123',
    user: { ...demoBaseUser, id: 2, name: '展示账号', role: 'display', permissions: ['people.view.all'] }
  },
  {
    account: 'user',
    password: 'user@123',
    user: { ...demoBaseUser, id: 3, name: '普通用户', role: 'user', permissions: ['people.edit.self'] }
  }
]

const DEMO_ENABLED = import.meta.env.VITE_ENABLE_DEMO === 'true'
const DEMO_LOCAL_ONLY = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1')

const readStoredAuth = () => {
  if (typeof window === 'undefined') {
    return { token: null, user: null, mode: null }
  }
  const localToken = localStorage.getItem(STORAGE_TOKEN_KEY)
  const sessionToken = sessionStorage.getItem(STORAGE_TOKEN_KEY)
  const storedToken = localToken || sessionToken
  const storedUserText =
    localStorage.getItem(STORAGE_USER_KEY) || sessionStorage.getItem(STORAGE_USER_KEY)
  let storedUser: User | null = null

  if (storedUserText) {
    try {
      storedUser = JSON.parse(storedUserText)
    } catch {
      localStorage.removeItem(STORAGE_TOKEN_KEY)
      sessionStorage.removeItem(STORAGE_TOKEN_KEY)
      localStorage.removeItem(STORAGE_USER_KEY)
      sessionStorage.removeItem(STORAGE_USER_KEY)
      return { token: null, user: null, mode: null }
    }
  }

  if (storedToken && !storedUser) {
    localStorage.removeItem(STORAGE_TOKEN_KEY)
    sessionStorage.removeItem(STORAGE_TOKEN_KEY)
    return { token: null, user: null, mode: null }
  }

  const mode = localToken ? 'local' : sessionToken ? 'session' : null
  if (storedToken && storedUser) {
    setAuthToken(storedToken)
  }
  return { token: storedToken, user: storedUser, mode }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialAuth = readStoredAuth()
  const [user, setUser] = useState<User | null>(initialAuth.user)
  const [token, setToken] = useState<string | null>(initialAuth.token)
  const [storageMode, setStorageMode] = useState<'local' | 'session' | null>(initialAuth.mode)

  const resolveStorage = (mode: 'local' | 'session' | null) =>
    mode === 'session' ? sessionStorage : localStorage

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (token && token === 'demo-token' && (!DEMO_ENABLED || !DEMO_LOCAL_ONLY)) {
      localStorage.removeItem(STORAGE_TOKEN_KEY)
      sessionStorage.removeItem(STORAGE_TOKEN_KEY)
      localStorage.removeItem(STORAGE_USER_KEY)
      sessionStorage.removeItem(STORAGE_USER_KEY)
      setToken(null)
      setUser(null)
      setStorageMode(null)
      setAuthToken(null)
      return
    }
    if (token) {
      setAuthToken(token)
    }
  }, [token])

  const login = async (payload: LoginPayload) => {
    const account = sanitizeInput(payload.account.trim())
    const password = sanitizeInput(payload.password.trim())
    const matched = DEMO_ENABLED && DEMO_LOCAL_ONLY
      ? demoAccounts.find((item) => item.account === account && item.password === password)
      : null

    if (matched && DEMO_ENABLED) {
      const mode = payload.remember ? 'local' : 'session'
      const storage = resolveStorage(mode)
      setStorageMode(mode)
      setUser(matched.user)
      setToken('demo-token')
      storage.setItem(STORAGE_TOKEN_KEY, 'demo-token')
      storage.setItem(STORAGE_USER_KEY, JSON.stringify(matched.user))
      setAuthToken('demo-token')
      return
    }

    // TODO: replace with real API call to /api/login when backend is wired.
    const response = await loginService({ account, password })
    const nextToken = response?.token as string
    const nextUser = response?.user as User
    const mode = payload.remember ? 'local' : 'session'
    const storage = resolveStorage(mode)
    setStorageMode(mode)
    setToken(nextToken)
    setUser(nextUser)
    storage.setItem(STORAGE_TOKEN_KEY, nextToken)
    storage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser))
    setAuthToken(nextToken)
  }

  const updateUser = (nextUser: User) => {
    setUser(nextUser)
    const storage = resolveStorage(storageMode)
    storage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_TOKEN_KEY)
    localStorage.removeItem(STORAGE_USER_KEY)
    sessionStorage.removeItem(STORAGE_TOKEN_KEY)
    sessionStorage.removeItem(STORAGE_USER_KEY)
    setAuthToken(null)
    setStorageMode(null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      updateUser
    }),
    [user, token, storageMode]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
