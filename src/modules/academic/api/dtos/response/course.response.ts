export type CourseResponse = {
  id: number
  extra?: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string | null
  name: { en: string; es: string }
  description: { en: string; es: string }
  learning_outcome: string
}
