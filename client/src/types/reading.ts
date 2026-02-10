export interface ReadingItem {
  id: number
  title: string
  category: string
  summary?: string
  content?: string
  cover_url?: string
  source_url?: string
  read_minutes?: number | null
  published_at?: string
  created_at?: string
  updated_at?: string
  author_name?: string | null
}
