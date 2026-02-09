import { api } from '../utils/api'

export async function exportPeople(params?: { personId?: number }) {
  const response = await api.get('/export/people', { params, responseType: 'blob' })
  return response
}

export async function importExcel(payload: FormData, allowCreate: boolean) {
  const response = await api.post(`/import/excel?allowCreate=${allowCreate ? 1 : 0}`, payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response
}
