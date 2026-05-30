// Espejo de UploadLogListItem (back). Vista 4.3.

export const UPLOAD_LOG_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK'] as const
export type UploadLogStatus = (typeof UPLOAD_LOG_STATUSES)[number]

export interface UploadLog {
  id: number
  upload_type: string
  status: UploadLogStatus | string
  academic_period_id: number | null
  user_id: number | null
  source_file: string | null
  total_rows: number | null
  loaded_rows: number | null
  error_rows: number | null
  created_at: string
  rollback_at: string | null
}

export interface UploadLogFilters {
  upload_type?: string
  status?: UploadLogStatus
  academic_period_id?: number
  limit?: number
  offset?: number
}

// Una fila de error reconstruida para el drawer (vista 4.3 §2).
export interface ParsedErrorRow {
  rowNumber: number
  messages: string[]
  // Celda original por columna — base para la edición in-place.
  cells: Record<string, string>
}
