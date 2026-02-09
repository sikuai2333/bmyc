import { api } from '../utils/api'
import type { Certificate } from '../types/archive'

export async function fetchCertificates(personId: number) {
  const { data } = await api.get('/certificates', { params: { personId } })
  return data as Certificate[]
}

export async function createCertificate(formData: FormData) {
  const { data } = await api.post('/certificates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function deleteCertificate(id: number) {
  const { data } = await api.delete(`/certificates/${id}`)
  return data
}

export async function fetchCertificateFile(id: number) {
  const response = await api.get(`/certificates/${id}/file`, { responseType: 'blob' })
  return response
}
