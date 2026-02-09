import { api } from '../utils/api'
import type { LoginPayload } from '../types/auth'

export async function login(payload: Pick<LoginPayload, 'account' | 'password'>) {
  const { data } = await api.post('/login', {
    email: payload.account,
    password: payload.password
  })
  return data
}
