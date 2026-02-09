import { api } from '../utils/api'
import type { Permission } from '../types/auth'

export async function fetchUsers() {
  const { data } = await api.get('/users')
  return data
}

export async function createUser(payload: {
  name: string
  email: string
  password: string
  role: string
  personId?: number | null
  permissions?: Permission[]
  isSuperAdmin?: boolean
  sensitiveUnmasked?: boolean
}) {
  const { data } = await api.post('/users', payload)
  return data
}

export async function updateUser(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put(`/users/${id}`, payload)
  return data
}

export async function deleteUser(id: number) {
  const { data } = await api.delete(`/users/${id}`)
  return data
}

export async function fetchPermissions() {
  const { data } = await api.get('/permissions')
  return data as Permission[]
}

export async function fetchLogs(params?: { limit?: number; offset?: number }) {
  const { data } = await api.get('/logs', { params })
  return data
}
