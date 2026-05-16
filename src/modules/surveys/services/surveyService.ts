import { apiGet, apiPost } from './apiClient'
import type {
  SurveyTokenVerification,
  SurveyOutcomesResponse,
  SurveySubmitRequest,
  SurveySubmitResponse,
} from '../types'

const LANG = 'es-PE'

export async function verifyLCFCSurveyToken(
  escuela: string,
  token: string
): Promise<SurveyTokenVerification> {
  const res = await apiGet<{ success: boolean; resource?: SurveyTokenVerification }>(
    `lcfc/notificacion/escuela/${escuela}/token/${token}`
  )
  if (!res.resource) throw new Error('Token inválido o expirado')
  return res.resource
}

export async function getLCFCSurveyOutcomes(
  escuela: string,
  alumnoId: number,
  encuestaId: number
): Promise<SurveyOutcomesResponse> {
  const res = await apiGet<{
    success: boolean
    data?: { resource?: SurveyOutcomesResponse }
  }>(
    `lcfc/encuesta/escuela/${escuela}/idioma/${LANG}/alumno/${alumnoId}/encuesta/${encuestaId}`
  )
  if (!res.data?.resource) throw new Error('No se pudieron obtener los outcomes')
  return res.data.resource
}

export async function submitLCFCSurvey(
  request: SurveySubmitRequest
): Promise<SurveySubmitResponse> {
  return apiPost<SurveySubmitResponse>('lcfc/encuesta/completar', request)
}
