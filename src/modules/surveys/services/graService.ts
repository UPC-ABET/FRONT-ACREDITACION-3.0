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
  GRAStudent,
  StudentSearchResult,
  EmailTemplate,
  SendEmailRequest,
  SendEmailResponse,
  SurveyApiResponse,
  FileResource,
  PageInfo,
} from '../types'

const SCHOOL = '1'
const LANG = 'es-PE'

// ─── Competences ───────────────────────────────────────────────────────────
export async function listGRACompetences(
  idPeriodoAcademico: number,
  idCarrera = 0
): Promise<CompetenceConfig[]> {
  const res = await apiPost<{ success: boolean; lstConfig: CompetenceConfig[] }>(
    'Survey/list-gra-configurations',
    {
      body: { escuela: SCHOOL, idioma: LANG, idPeriodoAcademico, idCarrera },
      page: { pageNumber: 0, pageSize: -1 },
    }
  )
  return res.lstConfig ?? []
}

export async function saveGRACompetence(data: CompetenceFormData) {
  return apiPost<SurveyApiResponse>('Survey/add-update-gra-config', {
    body: { idioma: LANG, ...data },
  })
}

export async function deleteGRACompetence(id: number) {
  return apiDelete<SurveyApiResponse>('Survey/Delete-gra-config', { id })
}

export async function cloneGRAConfiguration(params: {
  idCarreraOrigen: number
  idPeriodoOrigen: number
  idCarreraDestino: number
  idPeriodoDestino: number
}) {
  return apiPost<SurveyApiResponse>('Survey/ReplicarConfiguracionGRA', {
    body: { escuela: SCHOOL, ...params },
  })
}

// ─── Students ──────────────────────────────────────────────────────────────
export async function searchStudentByCode(
  codigoEstudiante: string,
  idCarrera: number
): Promise<StudentSearchResult> {
  const res = await apiPost<SurveyApiResponse<StudentSearchResult>>(
    'email/findStudentCode-career-GRA',
    { codigoEstudiante, idCarrera }
  )
  return res.data?.resource as StudentSearchResult
}

export async function addStudentToNotification(params: {
  idEstudiante: number
  idEncuesta: number
  emailEstudiante: string
  nombreEstudiante: string
}) {
  return apiPost<SurveyApiResponse>('email/saveNotification-GRA', params)
}

export async function deleteStudentNotification(notificationId: number) {
  return apiPost<SurveyApiResponse>('email/deleteNotification-GRA', {
    idNotificacion: notificationId,
  })
}

export async function listGRAStudents(
  idEncuesta: number,
  page = 0,
  pageSize = 20
): Promise<{ students: GRAStudent[]; pageInfo?: PageInfo }> {
  const res = await apiPost<SurveyApiResponse<GRAStudent[]>>(
    'email/listStudentNotification-GRA',
    { idEncuesta, pageNumber: page, pageSize }
  )
  return {
    students: (res.data?.resource ?? []) as GRAStudent[],
    pageInfo: res.data?.pageInfo,
  }
}

// ─── Email template ────────────────────────────────────────────────────────
export async function getGRAEmailTemplate(idEncuesta: number): Promise<EmailTemplate> {
  const res = await apiPost<SurveyApiResponse<EmailTemplate>>(
    'email/getConfigurationNotification-GRA',
    { idEncuesta }
  )
  return (res.data?.resource ?? { asunto: '', cuerpo: '' }) as EmailTemplate
}

export async function saveGRAEmailTemplate(template: EmailTemplate) {
  return apiPost<SurveyApiResponse>('email/saveConfirmationNotif-GRA', template)
}

export async function sendGRAEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  return apiPost<SendEmailResponse>('email/emailSurvey-GRA', request)
}

// ─── Massive upload ────────────────────────────────────────────────────────
export async function downloadGRATemplate(idPeriodoAcademico: number): Promise<void> {
  const res = await apiPost<{ success: boolean; data?: { resource?: FileResource } }>(
    'excel/template-GRA',
    {
      body: { escuela: SCHOOL, idioma: LANG, idPeriodoAcademico },
      page: { pageNumber: 0, pageSize: -1 },
    }
  )
  const resource = res.data?.resource
  if (!resource) throw new Error('No se pudo obtener la plantilla')
  triggerFileDownload(resource.fileContents, resource.contentType, resource.fileDownloadName)
}

export async function uploadGRAMassive(file: File, escuelaActual?: unknown): Promise<void> {
  const archivoBase64 = await fileToBase64(file)
  const blob = await apiPostBlob('excel/uploadNotificationEncuesta-GRA', {
    idCarrera: 0,
    validarCarrera: false,
    escuelaId: SCHOOL,
    escuelaActual: escuelaActual ?? { id: 1, nombre: 'Escuela', cod: 'E' },
    archivoBase64,
    nombreArchivo: file.name,
  })
  triggerBlobDownload(blob, `Reporte_Carga_GRA_${Date.now()}.xlsx`)
}

// ─── Reports ───────────────────────────────────────────────────────────────
export async function generateGRAPerceptionReport(params: {
  idPeriodoAcademico?: number
  idCarrera?: number
  idComision?: number
}) {
  return apiPost<{
    success: boolean
    data?: {
      pdfFiles?: Array<{ fileName: string; base64Content: string }>
      zipFile?: { base64Content: string; fileName: string }
    }
  }>('report/gra-perception', {
    body: { escuela: SCHOOL, idioma: LANG, ...params },
    page: { pageNumber: 0, pageSize: -1 },
  })
}
