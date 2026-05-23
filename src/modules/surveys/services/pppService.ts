import { apiPost, apiGet, apiDelete, apiPostBlob, triggerFileDownload, triggerBlobDownload, fileToBase64 } from './apiClient'
import type {
  CompetenceConfig,
  CompetenceFormData,
  AcceptanceLevel,
  FileResource,
  DashboardResponse,
} from '../types'

const SCHOOL = '1'
const LANG = 'es-PE'

// ─── Internal backend shapes ───────────────────────────────────────────────

interface BackendPppConfig {
  id: number
  outcome_id: number
  is_active: boolean
  is_visible?: boolean
  extra?: {
    survey_type?: string
    name_es?: string
    name_en?: string
    description_es?: string
    description_en?: string
    order?: number
    program_id?: number
    academic_period_id?: number
    is_visible?: boolean
  }
  user_outcome_name?: string
  outcome_code?: string
}

interface BackendAcceptanceLevel {
  id: number
  min_score: number
  max_score: number
  name: { es?: string; en?: string } | string
  color?: string
  order?: number
  is_final?: boolean
}

// ─── Adapters ──────────────────────────────────────────────────────────────

function adaptPppConfig(raw: BackendPppConfig): CompetenceConfig {
  const extra = raw.extra ?? {}
  return {
    id: raw.id,
    outcomeId: raw.outcome_id,
    competenciaGeneral: extra.name_es ?? raw.user_outcome_name ?? '',
    competenciaEspecifica: extra.name_en ?? extra.name_es ?? '',
    descripcion: extra.description_es ?? '',
    nivelAceptacion: extra.order ?? 3,
    isActive: raw.is_active,
    estado: raw.is_active ? 'ACTIVO' : 'INACTIVO',
    idCarrera: extra.program_id,
    idPeriodo: extra.academic_period_id,
  }
}

function adaptAcceptanceLevel(raw: BackendAcceptanceLevel, index: number): AcceptanceLevel {
  const nameEs = typeof raw.name === 'string' ? raw.name : (raw.name?.es ?? `Nivel ${index + 1}`)
  return {
    id: raw.id,
    nivel: raw.order ?? index + 1,
    descripcion: nameEs,
    rango: `${raw.min_score} – ${raw.max_score}`,
    minScore: raw.min_score,
    maxScore: raw.max_score,
    color: raw.color,
  }
}

const RANGE_RE = /([\d.]+)\s*[–-]\s*([\d.]+)/

function buildAcceptanceLevelItem(level: AcceptanceLevel) {
  const rangeMatch = RANGE_RE.exec(level.rango ?? '')
  const minScore = level.minScore ?? (rangeMatch ? Number.parseFloat(rangeMatch[1]) : (level.nivel - 1))
  const maxScore = level.maxScore ?? (rangeMatch ? Number.parseFloat(rangeMatch[2]) : level.nivel)
  return {
    id: level.id,
    min_score: minScore,
    max_score: maxScore,
    name: { es: level.descripcion, en: level.descripcion },
    color: level.color ?? '#888888',
    order: level.nivel,
    is_final: false,
  }
}

// ─── Competences ───────────────────────────────────────────────────────────

export async function listPPPCompetences(
  academic_period_id: number,
  program_id = 0
): Promise<CompetenceConfig[]> {
  const res = await apiPost<BackendPppConfig[] | { data?: BackendPppConfig[] }>(
    'ppp/config/get-by-filters',
    { program_id: program_id || undefined, academic_period_id, is_active: true }
  )
  const list = Array.isArray(res) ? res : ((res as { data?: BackendPppConfig[] }).data ?? [])
  return list.map((c) => adaptPppConfig(c))
}

export async function savePPPCompetence(data: CompetenceFormData) {
  const isNew = !data.id || data.id === 0

  if (isNew) {
    return apiPost('ppp/config/create', {
      outcome_id: data.outcome_id ?? 1,
      name_es: data.competenciaGeneral,
      name_en: data.competenciaEspecifica || data.competenciaGeneral,
      description_es: data.descripcion,
      description_en: data.descripcion,
      order: data.nivelAceptacion,
      program_id: data.idCarrera ?? 0,
      academic_period_id: data.idPeriodoAcademico,
      is_visible: true,
    })
  }

  return apiPost(`ppp/config/update/${data.id}`, {
    name_es: data.competenciaGeneral,
    name_en: data.competenciaEspecifica || data.competenciaGeneral,
    description_es: data.descripcion,
    description_en: data.descripcion,
    order: data.nivelAceptacion,
    is_visible: true,
  })
}

export async function deletePPPCompetence(id: number) {
  return apiDelete(`ppp/config/delete/${id}`)
}

export async function clonePPPConfiguration(params: {
  idCarreraOrigen: number
  idPeriodoOrigen: number
  idCarreraDestino: number
  idPeriodoDestino: number
}) {
  return apiPost('ppp/config/replicate', {
    source_academic_period_id: params.idPeriodoOrigen,
    target_academic_period_id: params.idPeriodoDestino,
    program_id: params.idCarreraDestino,
  })
}

// ─── Acceptance levels ─────────────────────────────────────────────────────

export async function listAcceptanceLevels(academic_period_id: number): Promise<AcceptanceLevel[]> {
  const res = await apiPost<BackendAcceptanceLevel[] | { data?: BackendAcceptanceLevel[] }>(
    'acceptance-levels/list',
    { survey_type_code: 'PPP', academic_period_id }
  )
  const obj = res as { data?: BackendAcceptanceLevel[] }
  const list = Array.isArray(res) ? res : (obj.data ?? [])
  return list.map((l, i) => adaptAcceptanceLevel(l, i))
}

export async function updateAcceptanceLevels(
  _academic_period_id: number,
  niveles: AcceptanceLevel[]
) {
  return apiPost('acceptance-levels/bulk-update', {
    items: niveles.filter((n) => n.id).map(buildAcceptanceLevelItem),
  })
}

// ─── Excel template & upload ───────────────────────────────────────────────

export async function downloadPPPTemplate(idPeriodoAcademico: number): Promise<void> {
  const res = await apiPost<{ success: boolean; data?: { resource?: FileResource } }>(
    'excel/template-PPP',
    { body: { escuela: SCHOOL, idioma: LANG, idPeriodoAcademico }, page: { pageNumber: 0, pageSize: -1 } }
  )
  const resource = res.data?.resource
  if (!resource) throw new Error('No se pudo obtener la plantilla')
  triggerFileDownload(resource.fileContents, resource.contentType, resource.fileDownloadName)
}

export async function uploadPPPMassive(
  file: File,
  academic_period_id: number,
  program_id = 0,
  campus_id = 0
): Promise<void> {
  const file_base64 = await fileToBase64(file)
  const res = await apiPost<{ total: number; success: number; failed: number; errors?: unknown[] }>(
    'ppp/survey/upload-excel',
    { file_base64, academic_period_id, program_id, campus_id }
  )
  if (res.failed && res.failed > 0) {
    console.warn(`PPP upload: ${res.failed} filas fallidas de ${res.total}`)
  }
}

export async function uploadPPPMassiveLegacy(file: File, escuelaActual?: unknown): Promise<void> {
  const archivoBase64 = await fileToBase64(file)
  const blob = await apiPostBlob('excel/upload-PPP', {
    idCarrera: 0,
    validarCarrera: false,
    escuelaId: SCHOOL,
    escuelaActual: escuelaActual ?? { id: 1, nombre: 'Escuela', cod: 'E' },
    archivoBase64,
    nombreArchivo: file.name,
  })
  triggerBlobDownload(blob, `Reporte_Carga_PPP_${Date.now()}.xlsx`)
}

// ─── Dashboard / Reports ───────────────────────────────────────────────────

export async function generatePPPDashboard(params: {
  academic_period_id?: number
  program_id?: number
  campus_id?: number
  practice_number?: number
}): Promise<DashboardResponse> {
  const res = await apiPost<DashboardResponse>('ppp/survey/dashboard', params)
  return res
}

export async function generatePPPFindings(params: {
  academic_period_id?: number
  program_id?: number
  campus_id?: number
  practice_number?: number
}) {
  return apiPost('ppp/survey/generate-findings', params)
}

// ─── Legacy perception report (kept for backward compat) ──────────────────

export async function generatePPPPerceptionReport(params: {
  idPeriodoAcademico?: number
  idCarrera?: number
  idComision?: number
}) {
  return generatePPPDashboard({
    academic_period_id: params.idPeriodoAcademico,
    program_id: params.idCarrera,
  })
}

// ─── Acceptance level defaults ────────────────────────────────────────────

export async function generateAcceptanceLevelDefaults(
  survey_type_code: 'PPP' | 'GRA',
  academic_period_id: number
) {
  return apiPost('acceptance-levels/generate-defaults', {
    survey_type_code,
    academic_period_id,
  })
}

// ─── PPP Survey CRUD ──────────────────────────────────────────────────────

export async function getPPPSurveyById(id: number) {
  return apiGet(`ppp/survey/get-by-id/${id}`)
}

export async function getPPPSurveysByFilters(params: {
  program_id?: number
  academic_period_id?: number
  campus_id?: number
  student_id?: number
  practice_number?: number
}) {
  return apiPost('ppp/survey/get-by-filters', params)
}
