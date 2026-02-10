import { api } from '../utils/api'
import type { Evaluation } from '../types/archive'

export async function fetchEvaluations(personId: number) {
  const { data } = await api.get('/evaluations', { params: { personId } })
  return data as Evaluation[]
}

export async function createEvaluation(payload: {
  personId: number
  type: string
  period: string
  content: string
}) {
  const { data } = await api.post('/evaluations', payload)
  return data
}
