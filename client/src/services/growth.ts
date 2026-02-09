import { api } from '../utils/api'
import type { GrowthEvent } from '../types/archive'

export async function fetchGrowth(personId: number) {
  const { data } = await api.get('/growth', { params: { personId } })
  return data as GrowthEvent[]
}

export async function createGrowth(payload: {
  personId: number
  eventDate: string
  title: string
  description?: string
  category?: string
}) {
  const { data } = await api.post('/growth', payload)
  return data
}

export async function deleteGrowth(id: number) {
  const { data } = await api.delete(`/growth/${id}`)
  return data
}
