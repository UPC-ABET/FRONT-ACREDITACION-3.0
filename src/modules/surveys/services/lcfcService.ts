import { apiPost, apiGet } from './apiClient'
import type {
  LCFCCourse,
  LCFCNotificationSendRequest,
  DashboardResponse,
  SurveyApiResponse,
  PageInfo,
} from '../types'

// ─── Internal backend shapes ───────────────────────────────────────────────

interface BackendLcfcConfig {
  id: number
  is_active: boolean
  extra?: {
    course_section_id?: number
    program_id?: number
    academic_period_id?: number
  }
  course_name?: string
  course_code?: string
  course_section_id?: number
}

// ─── Adapter ───────────────────────────────────────────────────────────────

function adaptLcfcConfig(raw: BackendLcfcConfig): LCFCCourse {
  return {
    idCurso: raw.course_section_id ?? raw.extra?.course_section_id ?? raw.id,
    nombreCurso: raw.course_name ?? `Curso ${raw.id}`,
    codigo: raw.course_code ?? '',
    isActive: raw.is_active,
    comisiones: [],
  }
}

// ─── Configuration ─────────────────────────────────────────────────────────

export async function listLCFCCourses(
  _idEscuela: string,
  academic_period_id: number,
  program_id?: number,
  page = 0,
  pageSize = -1
): Promise<{ cursos: LCFCCourse[]; pageInfo?: PageInfo }> {
  const res = await apiPost<BackendLcfcConfig[] | SurveyApiResponse<BackendLcfcConfig[]>>(
    'lcfc/config/get-by-filters',
    { academic_period_id, program_id: program_id || undefined, is_active: undefined, pageNumber: page, pageSize }
  )

  if (Array.isArray(res)) {
    return { cursos: res.map((c) => adaptLcfcConfig(c)) }
  }
  const list = res.data?.resource ?? []
  return {
    cursos: list.map((c) => adaptLcfcConfig(c)),
    pageInfo: res.data?.pageInfo,
  }
}

export async function generateLCFCConfiguration(
  _escuela: string,
  academic_period_id: number,
  program_id?: number,
  campus_id?: number
) {
  return apiPost('lcfc/config/generate', {
    academic_period_id,
    program_id: program_id ?? 0,
    campus_id: campus_id ?? 0,
  })
}

export async function cloneLCFCConfiguration(_idPeriodoOrigen: number, _idPeriodoDestino: number): Promise<void> {
  throw new Error('La clonación de configuración LCFC no está disponible en esta versión del backend.')
}

export async function changeLCFCConfigStatus(
  config_id: number,
  nuevoEstado: 'ACTIVO' | 'INACTIVO'
) {
  return apiPost('lcfc/config/update-status', {
    updates: [{ config_id, is_active: nuevoEstado === 'ACTIVO' }],
  })
}

// ─── Notifications (new backend: single send-all operation) ────────────────

export async function sendLCFCNotification(request: LCFCNotificationSendRequest) {
  return apiPost('lcfc/notification/send', request)
}

// Legacy send used by older hook — kept for compatibility
export async function sendLCFCEmail(request: {
  idCiclo: number
  idPeriodo: number
  destinatarios: string
  asunto: string
  cuerpo: string
}) {
  return apiPost('lcfc/notificacion/envio', request)
}

// ─── Email params (legacy) ─────────────────────────────────────────────────

export async function getLCFCEmailParams(): Promise<Array<{ nombre: string; description: string }>> {
  return []
}

// ─── Excel template & upload ───────────────────────────────────────────────

export async function downloadLCFCTemplate(_idPeriodoAcademico: number): Promise<void> {
  throw new Error('La descarga de plantilla LCFC no está disponible en esta versión del backend.')
}

export async function uploadLCFCMassive(_file: File, _escuelaActual?: unknown): Promise<void> {
  throw new Error('La carga masiva LCFC no está disponible en esta versión del backend.')
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export async function generateLCFCDashboard(params: {
  academic_period_id?: number
  program_id?: number
  campus_id?: number
}): Promise<DashboardResponse> {
  return apiPost<DashboardResponse>('lcfc/dashboard', params)
}

export async function generateLCFCPerceptionReport(params: {
  idPeriodoAcademico?: number
  idEscuela?: string
  idPeriodo?: number
  idCarrera?: number
}) {
  return generateLCFCDashboard({
    academic_period_id: params.idPeriodoAcademico ?? params.idPeriodo,
    program_id: params.idCarrera,
  })
}

// ─── Token & survey (student-facing admin read) ────────────────────────────

export async function validateLCFCToken(token: string) {
  return apiGet(`lcfc/token/validate/${encodeURIComponent(token)}`)
}
