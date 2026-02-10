export interface Dimension {
  category: string
  detail: string
}

export interface Person {
  id: number
  name: string
  department?: string
  title?: string
  focus?: string
  bio?: string
  icon?: string
  birth_date?: string
  gender?: string
  phone?: string
  dimensionCount?: number
  dimensionMonthCount?: number
  latestDimensionMonth?: string | null
  tags?: string[]
}

export interface Meeting {
  id: number
  topic: string
  meetingDate: string
  location?: string
  category?: string
  summary?: string
  attendees?: Array<{ id: number; name: string; title?: string; role?: string }>
}

export interface Evaluation {
  id: number
  type: 'quarterly' | 'annual' | 'marriage'
  period: string
  content: string
  created_at?: string
  updated_at?: string
}

export interface GrowthEvent {
  id: number
  title: string
  event_date: string
  description?: string
  category?: string
}

export interface Certificate {
  id: number
  name: string
  category?: string
  issued_date?: string
  description?: string
  file_path?: string
  file_type?: string
  file_name?: string
  file_size?: number
}
