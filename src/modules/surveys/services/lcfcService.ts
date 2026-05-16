import {
  apiPost,
  apiGet,
  triggerFileDownload,
  fileToBase64,
  apiPostBlob,
  triggerBlobDownload,
} from './apiClient'
import type {
  LCFCCourse,
  LCFCStudent,
  LCFCEmailParam,
  LCFCSendRequest,
  LCFCConfigItem,
  SurveyApiResponse,
  FileResource,
  PageInfo,
} from '../types'

const SCHOOL = '1'
const LANG = 'es-PE'

// ─── Configuration ─────────────────────────────────────────────────────────
export async function listLCFCCourses(
  idEscuela: string,
  idPeriodo: number,
  page = 0,
  pageSize = -1
): Promise<{ cursos: LCFCCourse[]; pageInfo?: PageInfo }> {
  const res = await apiPost<SurveyApiResponse<{ cursos: LCFCCourse[] }>>(
    'lcfc/configuracion/pageable',
    { idEscuela, idPeriodo, pageNumber: page, pageSize }
  )
  const data = res.data?.resource as { cursos?: LCFCCourse[] } | undefined
  return { cursos: data?.cursos ?? [], pageInfo: res.data?.pageInfo }
}

export async function generateLCFCConfiguration(
  escuela: string,
  periodo: number
): Promise<SurveyApiResponse> {
  return apiPost<SurveyApiResponse>(
    `lcfc/configuracion/generar/escuela/${escuela}/periodo/${periodo}`,
    {}
  )
}

export async function cloneLCFCConfiguration(idPeriodoOrigen: number, idPeriodoDestino: number) {
  return apiPost<SurveyApiResponse>('lcfc/configuracion/clonar', {
    idPeriodoOrigen,
    idPeriodoDestino,
  })
}

export async function changeLCFCConfigStatus(
  idConfiguracion: number,
  nuevoEstado: 'ACTIVO' | 'INACTIVO'
) {
  return apiPost<SurveyApiResponse>('lcfc/configuracion/cambio', {
    idConfiguracion,
    nuevoEstado,
  })
}

// ─── Students / notifications ──────────────────────────────────────────────
export async function listLCFCStudents(
  idCiclo: number,
  idPeriodo: number,
  page = 0,
  pageSize = 20
): Promise<{ estudiantes: LCFCStudent[]; totalRegistros: number }> {
  const res = await apiPost<{
    success: boolean
    data?: {
      estudiantes?: LCFCStudent[]
      totalRegistros?: number
    }
  }>('lcfc/notificacion/paginado', { idCiclo, idPeriodo, pageNumber: page, pageSize })
  return {
    estudiantes: res.data?.estudiantes ?? [],
    totalRegistros: res.data?.totalRegistros ?? 0,
  }
}

export async function getLCFCEmailParams(): Promise<LCFCEmailParam[]> {
  const res = await apiGet<{ success: boolean; parametros?: LCFCEmailParam[] }>(
    'lcfc/notificacion/parametros'
  )
  return res.parametros ?? []
}

export async function sendLCFCEmail(request: LCFCSendRequest) {
  return apiPost<{ success: boolean; enviados?: number; fallidos?: number }>(
    'lcfc/notificacion/envio',
    request
  )
}

// ─── Template ──────────────────────────────────────────────────────────────
export async function downloadLCFCTemplate(idPeriodoAcademico: number): Promise<void> {
  const res = await apiPost<{ success: boolean; data?: { resource?: FileResource } }>(
    'excel/template-LCFC',
    {
      body: { escuela: SCHOOL, idioma: LANG, idPeriodoAcademico },
      page: { pageNumber: 0, pageSize: -1 },
    }
  )
  const resource = res.data?.resource
  if (!resource) throw new Error('No se pudo obtener la plantilla')
  triggerFileDownload(resource.fileContents, resource.contentType, resource.fileDownloadName)
}

export async function uploadLCFCMassive(file: File, escuelaActual?: unknown): Promise<void> {
  const archivoBase64 = await fileToBase64(file)
  const blob = await apiPostBlob('excel/uploadNotificationEncuesta-LCFC', {
    idCarrera: 0,
    validarCarrera: false,
    escuelaId: SCHOOL,
    escuelaActual: escuelaActual ?? { id: 1, nombre: 'Escuela', cod: 'E' },
    archivoBase64,
    nombreArchivo: file.name,
  })
  triggerBlobDownload(blob, `Reporte_Carga_LCFC_${Date.now()}.xlsx`)
}

// ─── Reports ───────────────────────────────────────────────────────────────
export async function generateLCFCPerceptionReport(params: {
  idPeriodoAcademico?: number
  idEscuela?: string
  idPeriodo?: number
  idCarrera?: number
}) {
  return apiPost<{
    success: boolean
    data?: { pdfFiles?: Array<{ fileName: string; base64Content: string }> }
  }>('lcfc/reporte/percepcion', {
    body: { escuela: SCHOOL, idioma: LANG, ...params },
    page: { pageNumber: 0, pageSize: -1 },
  })
}
