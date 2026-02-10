import axios from 'axios'

const inferApiBase = () => {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE as string
  if (typeof window === 'undefined') return 'http://localhost:4000/api'
  const { protocol, hostname, port } = window.location
  const inferredPort = port === '5173' ? '4000' : port
  const portSuffix = inferredPort ? `:${inferredPort}` : ''
  return `${protocol}//${hostname}${portSuffix}/api`
}

export const API_BASE = inferApiBase()

export const api = axios.create({
  baseURL: API_BASE
})

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}
