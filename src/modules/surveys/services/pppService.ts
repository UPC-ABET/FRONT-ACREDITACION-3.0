import {
  apiPost,
  apiDelete,
  apiPostBlob,
  triggerFileDownload,
  triggerBlobDownload,
  fileToBase64,
} from './apiClient'
import type {
  CompetenceConfig,
  CompetenceFormData,
  AcceptanceLevel,
  SurveyApiResponse,
  FileResource,
} from '../types'

const SCHOOL = '1'
const LANG = 'es-PE'

// ─── Cycles ────────────────────────────────────────────────────────────────
export async function getCycleList(modalityId?: string | number) {
  const res = await apiPost<SurveyApiResponse<unknown[]>>('cycles', {
    body: { escuela: SCHOOL, idioma: LANG, modalityId },
    page: { pageNumber: 0, pageSize: -1 },
  })
  return (res.data?.resource ?? []) as Array<{ id: number; nombre: string }>
}

// ─── Competences list ──────────────────────────────────────────────────────
export async function listPPPCompetences(
  idPeriodoAcademico: number,
  idCarrera = 0
): Promise<CompetenceConfig[]> {
  const res = await apiPost<{ success: boolean; lstConfig: CompetenceConfig[]; message?: string }>(
    'Survey/list-ppp-configurations',
    {
      body: { escuela: SCHOOL, idioma: LANG, idPeriodoAcademico, idCarrera },
      page: { pageNumber: 0, pageSize: -1 },
    }
  )
  return res.lstConfig ?? []
}

// ─── Add / update competence ───────────────────────────────────────────────
export async function savePPPCompetence(data: CompetenceFormData) {
  return apiPost<SurveyApiResponse>('Survey/add-update-ppp-config', {
    body: { idioma: LANG, ...data },
  })
}

// ─── Delete competence ─────────────────────────────────────────────────────
export async function deletePPPCompetence(id: number) {
  return apiDelete<SurveyApiResponse>('Survey/Delete-by-Id-config', { id })
}

// ─── Clone configuration ───────────────────────────────────────────────────
export async function clonePPPConfiguration(params: {
  idCarreraOrigen: number
  idPeriodoOrigen: number
  idCarreraDestino: number
  idPeriodoDestino: number
}) {
  return apiPost<SurveyApiResponse>('Survey/ReplicarConfiguracionPPP', {
    body: { escuela: SCHOOL, ...params },
  })
}

// ─── Acceptance levels ─────────────────────────────────────────────────────
export async function listAcceptanceLevels(idPeriodoAcademico: number): Promise<AcceptanceLevel[]> {
  const res = await apiPost<SurveyApiResponse<AcceptanceLevel[]>>(
    'Survey/list-niveles-aceptacion',
    { body: { escuela: SCHOOL, idioma: LANG, idPeriodoAcademico } }
  )
  return (res.data?.resource ?? []) as AcceptanceLevel[]
}

export async function updateAcceptanceLevels(
  idPeriodoAcademico: number,
  niveles: AcceptanceLevel[]
) {
  return apiPost<SurveyApiResponse>('Survey/Update-niveles-aceptacion', {
    body: { escuela: SCHOOL, idioma: LANG, idPeriodoAcademico, niveles },
  })
}

// ─── Download template ─────────────────────────────────────────────────────
export async function downloadPPPTemplate(idPeriodoAcademico: number): Promise<void> {
  const res = await apiPost<{ success: boolean; data?: { resource?: FileResource } }>(
    'excel/template-PPP',
    {
      body: { escuela: SCHOOL, idioma: LANG, idPeriodoAcademico },
      page: { pageNumber: 0, pageSize: -1 },
    }
  )
  const resource = res.data?.resource
  if (!resource) throw new Error('No se pudo obtener la plantilla')
  triggerFileDownload(resource.fileContents, resource.contentType, resource.fileDownloadName)
}

// ─── Massive upload ────────────────────────────────────────────────────────
export async function uploadPPPMassive(
  file: File,
  escuelaActual?: unknown
): Promise<void> {
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

// ─── Reports ───────────────────────────────────────────────────────────────
export async function generatePPPPerceptionReport(params: {
  idPeriodoAcademico?: number
  idCarrera?: number
  idComision?: number
}) {
  const res = await apiPost<{
    success: boolean
    data?: {
      pdfFiles?: Array<{ fileName: string; base64Content: string }>
      zipFile?: { base64Content: string; fileName: string }
    }
    message?: string
  }>('report/ppp-perception', {
    body: { escuela: SCHOOL, idioma: LANG, ...params },
    page: { pageNumber: 0, pageSize: -1 },
  })
  return res
}
