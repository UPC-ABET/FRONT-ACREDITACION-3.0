import { apiGet, apiPost } from '@/shared/lib'
import type {
  SurveyTokenVerification,
  SurveyOutcomesResponse,
  SurveyCommissionGroup,
  SurveySubmitRequest,
  SurveySubmitResponse,
} from '../types'

const LANG = 'es-PE'

// ─── Internal backend shapes ───────────────────────────────────────────────

interface BackendTokenValidation {
  survey_id?: number
  survey_status?: string
  student_id?: number
  student_code?: string
  student_name?: string
  student_email?: string
  program_id?: number
  program_name?: string
  campus_id?: number
  course_section_id?: number
  course_name?: string
  max_register_date?: string
  academic_period?: string
  is_completed?: boolean
  // LCFC legacy fields that may still come from old endpoint
  estado?: boolean
  nombreCarrera?: string
  ciclo?: string
  codigo?: string
  codigoEstudiante?: string
  nombreCurso?: string
  idAlumno?: number
  encuestaId?: number
  escuela?: string
}

interface BackendOutcome {
  outcome_config_id?: number
  outcome_id: number
  name?: string
  description?: string
  commission_id?: number
  commission_name?: string
  order?: number
  // legacy fields
  comisionId?: number
  comisionNombre?: string
  competenciaEspecifica?: string
  competenciaGeneral?: string
  descripcion?: string
}

// ─── Adapters ──────────────────────────────────────────────────────────────

function adaptTokenVerification(
  raw: BackendTokenValidation,
  token: string
): SurveyTokenVerification {
  // Support both new backend shape and legacy shape
  return {
    token,
    escuela: raw.escuela ?? 'UPC',
    nombreCarrera: raw.program_name ?? raw.nombreCarrera ?? '',
    ciclo: raw.academic_period ?? raw.ciclo ?? '',
    codigoEstudiante: raw.student_code ?? raw.codigoEstudiante ?? raw.codigo,
    codigo: raw.student_code ?? raw.codigo,
    nombreEstudiante: raw.student_name,
    nombreCurso: raw.course_name ?? raw.nombreCurso,
    estado: raw.is_completed ?? raw.estado ?? false,
    alumnoId: raw.student_id ?? raw.idAlumno ?? 0,
    encuestaId: raw.survey_id ?? raw.encuestaId ?? 0,
    surveyId: raw.survey_id,
  }
}

function adaptOutcomes(
  raw: BackendOutcome[],
  verification: SurveyTokenVerification
): SurveyOutcomesResponse {
  // Group outcomes by commission
  const groups: Record<string, SurveyCommissionGroup> = {}

  for (const o of raw) {
    const commId = o.commission_id ?? o.comisionId ?? 0
    const commName = o.commission_name ?? o.comisionNombre ?? 'General'
    const key = String(commId)

    if (!groups[key]) {
      groups[key] = { comisionId: commId, comisionNombre: commName, outcomes: [] }
    }

    groups[key].outcomes.push({
      outcomeId: o.outcome_id,
      comisionId: commId,
      competenciaEspecifica: o.name ?? o.competenciaEspecifica ?? `Outcome ${o.outcome_id}`,
      competenciaGeneral: o.competenciaGeneral,
      descripcion: o.description ?? o.descripcion ?? '',
      desempeno: null,
    })
  }

  return {
    escuela: verification.escuela,
    nombreCarrera: verification.nombreCarrera,
    ciclo: verification.ciclo,
    nombreCurso: verification.nombreCurso,
    encuestaId: verification.encuestaId,
    lista: Object.values(groups).sort((a, b) => a.comisionId - b.comisionId),
  }
}

// ─── LCFC Student Survey ───────────────────────────────────────────────────

export async function verifyLCFCSurveyToken(
  _escuela: string,
  token: string
): Promise<SurveyTokenVerification> {
  // Try new endpoint first; fall back to legacy if needed
  try {
    const res = await apiGet<BackendTokenValidation>(
      `lcfc/token/validate/${encodeURIComponent(token)}`
    )
    return adaptTokenVerification(res, token)
  } catch {
    // Legacy endpoint
    const res = await apiGet<{ success: boolean; resource?: BackendTokenValidation }>(
      `lcfc/notificacion/escuela/${encodeURIComponent(_escuela)}/token/${encodeURIComponent(token)}`
    )
    if (!res.resource) throw new Error('Token inválido o expirado')
    return adaptTokenVerification(res.resource, token)
  }
}

export async function getLCFCSurveyOutcomes(
  _escuela: string,
  _alumnoId: number,
  _encuestaId: number,
  token?: string
): Promise<SurveyOutcomesResponse> {
  if (token) {
    // New endpoint: get outcomes by token
    const raw = await apiPost<BackendOutcome[] | { data?: { resource?: BackendOutcome[] } }>(
      'lcfc/survey/get-by-token',
      { token, language: LANG }
    )
    const obj = raw as { data?: { resource?: BackendOutcome[] } }
    const list = Array.isArray(raw) ? raw : (obj.data?.resource ?? [])

    const dummyVerif: SurveyTokenVerification = {
      token,
      escuela: 'UPC',
      nombreCarrera: '',
      ciclo: '',
      estado: false,
      alumnoId: _alumnoId,
      encuestaId: _encuestaId,
    }
    return adaptOutcomes(list, dummyVerif)
  }

  // Legacy endpoint
  const url =
    `lcfc/encuesta/escuela/${encodeURIComponent(_escuela)}` +
    `/idioma/${LANG}/alumno/${_alumnoId}/encuesta/${_encuestaId}`
  const res = await apiGet<{
    success: boolean
    data?: { resource?: SurveyOutcomesResponse }
  }>(url)
  if (!res.data?.resource) throw new Error('No se pudieron obtener los outcomes')
  return res.data.resource
}

export async function submitLCFCSurvey(
  request: SurveySubmitRequest
): Promise<SurveySubmitResponse> {
  if (request.token) {
    // New backend
    const scores = request.lista.map((item) => ({
      outcome_id: item.outcomeId,
      score: item.puntaje,
      commentaries: item.descripcion || undefined,
    }))
    const res = await apiPost<{ success: boolean; message?: string }>('lcfc/survey/complete', {
      token: request.token,
      commentaries: request.comentario,
      scores,
    })
    return {
      success: res.success,
      data: { message: res.message ?? 'Encuesta enviada exitosamente' },
    }
  }

  // Legacy endpoint
  return apiPost<SurveySubmitResponse>('lcfc/encuesta/completar', {
    comentario: request.comentario,
    encuestaId: request.encuestaId,
    escuela: request.escuela,
    lista: request.lista,
  })
}

// ─── GRA Student Survey ────────────────────────────────────────────────────

export async function verifyGRASurveyToken(token: string): Promise<SurveyTokenVerification> {
  const res = await apiGet<BackendTokenValidation>(
    `gra/token/validate/${encodeURIComponent(token)}`
  )
  return adaptTokenVerification(res, token)
}

export async function getGRASurveyByToken(token: string): Promise<SurveyOutcomesResponse> {
  const raw = await apiPost<BackendOutcome[] | { data?: { resource?: BackendOutcome[] } }>(
    'gra/survey/get-by-token',
    { token, language: LANG }
  )
  const rawObj = raw as { data?: { resource?: BackendOutcome[] } }
  const list = Array.isArray(raw) ? raw : (rawObj.data?.resource ?? [])

  const dummyVerif: SurveyTokenVerification = {
    token,
    escuela: 'UPC',
    nombreCarrera: '',
    ciclo: '',
    estado: false,
    alumnoId: 0,
    encuestaId: 0,
  }
  return adaptOutcomes(list, dummyVerif)
}

export async function submitGRASurvey(
  token: string,
  comentario: string,
  scores: Array<{ outcomeConfigId: number; score: number; commentaries?: string }>
): Promise<SurveySubmitResponse> {
  const res = await apiPost<{ success: boolean; message?: string }>('gra/survey/complete', {
    token,
    commentaries: comentario,
    scores: scores.map((s) => ({
      outcome_config_id: s.outcomeConfigId,
      score: s.score,
      commentaries: s.commentaries,
    })),
  })
  return {
    success: res.success,
    data: { message: res.message ?? 'Encuesta enviada exitosamente' },
  }
}
