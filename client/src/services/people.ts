import { api } from '../utils/api'
import type { Person } from '../types/archive'

export async function fetchPeople(query?: string) {
  const { data } = await api.get('/personnel', { params: query ? { q: query } : undefined })
  return data as Person[]
}

export async function fetchPerson(personId: number) {
  const { data } = await api.get(`/personnel/${personId}`)
  return data as Person
}

export async function updatePerson(personId: number, payload: Partial<Person>) {
  const { data } = await api.put(`/personnel/${personId}`, payload)
  return data as Person
}

export async function createPerson(payload: Partial<Person>) {
  const { data } = await api.post('/personnel', payload)
  return data as Person
}

export async function deletePerson(personId: number) {
  const { data } = await api.delete(`/personnel/${personId}`)
  return data
}

export async function updatePersonDimensions(
  personId: number,
  payload: { dimensions: Array<{ category: string; detail: string }>; month: string }
) {
  const { data } = await api.put(`/personnel/${personId}/dimensions`, payload)
  return data
}

export async function fetchMonthlyDimensions(
  personId: number,
  params: { month?: string; months?: number }
) {
  const { data } = await api.get(`/personnel/${personId}/dimensions/monthly`, { params })
  return data
}
