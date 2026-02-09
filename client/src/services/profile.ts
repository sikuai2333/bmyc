import { api } from '../utils/api'

export async function updateSensitiveView(sensitiveUnmasked: boolean) {
  const { data } = await api.put('/profile/sensitive', { sensitiveUnmasked })
  return data
}
