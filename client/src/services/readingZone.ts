import { api } from '../utils/api'
import type { ReadingItem } from '../types/reading'

export interface ReadingPayload {
  title: string
  category: string
  summary?: string
  content?: string
  coverUrl?: string
  sourceUrl?: string
  readMinutes?: number | string
}

export async function fetchReadingItems(params?: { category?: string }) {
  const { data } = await api.get('/reading-zone', { params })
  return data as ReadingItem[]
}

export async function fetchReadingItem(id: number) {
  const { data } = await api.get(`/reading-zone/${id}`)
  return data as ReadingItem
}

export async function createReadingItem(payload: ReadingPayload) {
  const { data } = await api.post('/reading-zone', payload)
  return data as ReadingItem
}

export async function updateReadingItem(id: number, payload: ReadingPayload) {
  const { data } = await api.put(`/reading-zone/${id}`, payload)
  return data as ReadingItem
}

export async function deleteReadingItem(id: number) {
  const { data } = await api.delete(`/reading-zone/${id}`)
  return data
}
