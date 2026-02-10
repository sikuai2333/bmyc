import { api } from '../utils/api'
import type { Meeting } from '../types/archive'

export interface MeetingPayload {
  topic: string
  meetingDate: string
  location?: string
  summary?: string
  category?: string
  attendees?: Array<{ personId: number; role?: string }>
}

export async function fetchMeetings() {
  const { data } = await api.get('/meetings')
  return data as Meeting[]
}

export async function createMeeting(payload: MeetingPayload) {
  const { data } = await api.post('/meetings', payload)
  return data as Meeting
}

export async function deleteMeeting(id: number) {
  const { data } = await api.delete(`/meetings/${id}`)
  return data
}
