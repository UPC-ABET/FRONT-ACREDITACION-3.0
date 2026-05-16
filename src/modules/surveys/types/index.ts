// ─── Survey type identifiers ───────────────────────────────────────────────
export type SurveyType = 'PPP' | 'GRA' | 'LCFC'

// ─── Common pagination ─────────────────────────────────────────────────────
export interface PageRequest {
  pageNumber: number
  pageSize: number
}

export interface PageInfo {
  totalRecords: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

// ─── Common API request wrapper ────────────────────────────────────────────
export interface SurveyBodyRequest<T = Record<string, unknown>> {
  body: T & {
    escuela?: string
    idioma?: string
  }
  page?: PageRequest
}

// ─── Cycle / Academic Period ───────────────────────────────────────────────
export interface AcademicCycle {
  id: number
  nombre: string
  codigo?: string
}

export interface Career {
  id: number
  nombre: string
  codigo?: string
}

export interface Commission {
  id: number
  nombre: string
  idCarrera?: number
}

// ─── Competences (PPP / GRA) ───────────────────────────────────────────────
export interface CompetenceConfig {
  id: number
  competenciaGeneral: string
  competenciaEspecifica: string
  descripcion: string
  nivelAceptacion: number
  estado?: string
  idCarrera?: number
  idPeriodo?: number
  fechaCreacion?: string
  ultimaActualizacion?: string
}

export interface CompetenceFormData {
  id: number
  competenciaGeneral: string
  competenciaEspecifica: string
  descripcion: string
  nivelAceptacion: number
  idPeriodoAcademico: number
  idCarrera?: number
  escuela: string
}

export interface AcceptanceLevel {
  id?: number
  nivel: number
  descripcion: string
  rango: string
}

// ─── File download response ────────────────────────────────────────────────
export interface FileResource {
  fileContents: string
  contentType: string
  fileDownloadName: string
}

// ─── PPP ───────────────────────────────────────────────────────────────────
export interface PPPListResponse {
  success: boolean
  lstConfig: CompetenceConfig[]
  message?: string
}

export interface PPPCloneRequest {
  escuela: string
  idCarreraOrigen: number
  idPeriodoOrigen: number
  idCarreraDestino: number
  idPeriodoDestino: number
}

// ─── GRA Student Notification ─────────────────────────────────────────────
export interface GRAStudent {
  idNotificacion: number
  idEstudiante: number
  codigoEstudiante: string
  nombreEstudiante: string
  emailEstudiante: string
  estadoEnvio: string
  fechaEnvio?: string
  estadoRespuesta?: string
  fechaRespuesta?: string
}

export interface StudentSearchResult {
  idEstudiante: number
  codigo: string
  nombre: string
  email: string
  carrera: string
  ciclo?: string
}

export interface EmailTemplate {
  idEncuesta?: number
  asunto: string
  cuerpo: string
  htmlContent?: string
  idiomaTemplate?: string
}

export interface SendEmailRequest {
  idEncuesta: number
  destinatarios: 'TODOS' | 'SELECCIONADOS'
  idsSeleccionados?: number[]
  asunto?: string
  cuerpoEmail?: string
}

export interface SendEmailResponse {
  success: boolean
  data?: {
    enviados: number
    fallidos: number
    detallesFallo?: Array<{ idEstudiante: number; razon: string }>
  }
  message?: string
}

// ─── LCFC ──────────────────────────────────────────────────────────────────
export interface LCFCCourse {
  idCurso: number
  nombreCurso: string
  codigo: string
  comisiones: Array<{
    idComision: number
    nombreComision: string
    profesor?: string
  }>
}

export interface LCFCStudent {
  idAlumno: number
  codigo: string
  nombre: string
  email: string
  encuestaEnviada: boolean
  encuestaCompletada: boolean
}

export interface LCFCNotificationRequest {
  idCiclo: number
  idPeriodo: number
  pageNumber?: number
  pageSize?: number
}

export interface LCFCEmailParam {
  nombre: string
  description: string
}

export interface LCFCSendRequest {
  idCiclo: number
  idPeriodo: number
  destinatarios: 'TODOS' | 'SELECCIONADOS'
  selectedStudents?: number[]
  asunto: string
  cuerpo: string
}

export interface LCFCConfigItem {
  idConfiguracion?: number
  idCurso?: number
  nombreCurso?: string
  estado?: 'ACTIVO' | 'INACTIVO'
  comisiones?: Array<{ idComision: number; nombreComision: string }>
}

// ─── Student Survey (token-based access) ──────────────────────────────────
export interface SurveyOutcome {
  outcomeId: number
  comisionId: number
  competenciaGeneral?: string
  competenciaEspecifica: string
  descripcion: string
  desempeno: number | null
  tipoRespuesta?: string
  pesaje?: number
}

export interface SurveyCommissionGroup {
  comisionNombre: string
  comisionId: number
  outcomes: SurveyOutcome[]
}

export interface SurveyTokenVerification {
  escuela: string
  escuelaId?: number
  nombreEscuela?: string
  nombreCarrera: string
  ciclo: string
  codigoEstudiante?: string
  codigo?: string
  nombreEstudiante?: string
  nombreCurso?: string
  cursoCodigo?: string
  estado: boolean
  alumnoId: number
  encuestaId: number
  tokenValido?: boolean
  diasRestantes?: number
}

export interface SurveyOutcomesResponse {
  escuela: string
  nombreEscuela?: string
  nombreCarrera: string
  ciclo: string
  nombreCurso?: string
  cursoCodigo?: string
  encuestaId: number
  lista: SurveyCommissionGroup[]
}

export interface SurveySubmitItem {
  comisionId: number
  outcomeId: number
  puntaje: number
  descripcion?: string
}

export interface SurveySubmitRequest {
  comentario: string
  encuestaId: number
  escuela: string
  lista: SurveySubmitItem[]
}

export interface SurveySubmitResponse {
  success: boolean
  data?: {
    message: string
    encuestaId?: number
    fechaCompletacion?: string
  }
}

// ─── Reports ───────────────────────────────────────────────────────────────
export interface ReportFilter {
  idPeriodoAcademico?: number
  idCarrera?: number
  idComision?: number
  escuela?: string
  idioma?: string
}

export interface ReportPDFFile {
  fileName: string
  base64Content: string
}

export interface ReportResponse {
  success: boolean
  data?: {
    pdfFiles?: ReportPDFFile[]
    zipFile?: {
      base64Content: string
      fileName: string
    }
  }
  message?: string
}

// ─── Generic API response ──────────────────────────────────────────────────
export interface SurveyApiResponse<T = unknown> {
  success: boolean
  data?: {
    resource?: T
    pageInfo?: PageInfo
  }
  message?: string
}
