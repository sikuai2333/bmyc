import { api } from '../utils/api'

export async function fetchDimensionInsights() {
  const { data } = await api.get('/insights/dimensions')
  return data
}

export async function fetchCompletionInsights(params?: { months?: number }) {
  const { data } = await api.get('/insights/completions', { params })
  return data
}

export async function fetchPersonDimensionInsights(personId: number) {
  const { data } = await api.get('/insights/person-dimensions', { params: { personId } })
  return data
}
