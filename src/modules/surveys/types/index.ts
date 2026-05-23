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

// ─── Academic entities (from academic module) ──────────────────────────────
export interface AcademicPeriod {
  id: number
  nombre: string
  codigo?: string
}

export interface Program {
  id: number
  nombre: string
  codigo?: string
}

// ─── Competences (PPP / GRA) ───────────────────────────────────────────────
export interface CompetenceConfig {
  id: number
  outcomeId?: number
  competenciaGeneral: string   // maps to extra.name_es
  competenciaEspecifica: string // maps to extra.name_en
  descripcion: string          // maps to extra.description_es
  nivelAceptacion: number      // maps to extra.order
  estado?: string
  isActive?: boolean
  idCarrera?: number
  idPeriodo?: number
}

export interface CompetenceFormData {
  id: number
  outcome_id?: number         // required by new backend on create
  competenciaGeneral: string
  competenciaEspecifica: string
  descripcion: string
  nivelAceptacion: number
  idPeriodoAcademico: number
  idCarrera?: number
  escuela: string
}

// ─── Acceptance levels ─────────────────────────────────────────────────────
export interface AcceptanceLevel {
  id?: number
  nivel: number       // maps to backend "order"
  descripcion: string // maps to backend "name.es"
  rango: string       // derived from min_score – max_score
  minScore?: number
  maxScore?: number
  color?: string
}

// ─── File download response ────────────────────────────────────────────────
export interface FileResource {
  fileContents: string
  contentType: string
  fileDownloadName: string
}

// ─── PPP ───────────────────────────────────────────────────────────────────
export interface PPPCloneRequest {
  source_academic_period_id: number
  target_academic_period_id: number
  program_id: number
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

// ─── GRA Email Send (new backend) ─────────────────────────────────────────
export interface GRAEmailSendRequest {
  academic_period_id: number
  program_id: number
  survey_base_url: string
}

// ─── LCFC ──────────────────────────────────────────────────────────────────
export interface LCFCCourse {
  idCurso: number
  nombreCurso: string
  codigo: string
  isActive?: boolean
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

export interface LCFCEmailParam {
  nombre: string
  description: string
}

// Legacy LCFC send request (kept for backward compat)
export interface LCFCSendRequest {
  idCiclo: number
  idPeriodo: number
  destinatarios: 'TODOS' | 'SELECCIONADOS'
  selectedStudents?: number[]
  asunto: string
  cuerpo: string
}

// New backend LCFC notification send request
export interface LCFCNotificationSendRequest {
  academic_period_id: number
  program_id: number
  campus_id?: number
  course_section_id?: number
  max_register_date: string
  survey_base_url: string
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
  token?: string
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
  estado: boolean        // false = not answered yet, true = already answered
  alumnoId: number
  encuestaId: number
  tokenValido?: boolean
  diasRestantes?: number
  surveyId?: number
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
  token?: string          // new backend uses token
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

// ─── Reports / Dashboard ───────────────────────────────────────────────────
export interface ReportFilter {
  idPeriodoAcademico?: number
  idCarrera?: number
  idComision?: number
  escuela?: string
  idioma?: string
}

export interface DashboardOutcome {
  outcome_id: number
  outcome_code?: string
  outcome_name: string
  average_score: number
  color: 'ROJO' | 'AMARILLO' | 'VERDE'
  total_responses: number
}

export interface DashboardSummary {
  total_surveys: number
  rojo?: number
  amarillo?: number
  verde?: number
  completed?: number
  pending?: number
  completion_rate_pct?: number
}

export interface DashboardResponse {
  summary: DashboardSummary
  outcomes?: DashboardOutcome[]
  by_program?: unknown[]
  by_course?: unknown[]
  filters?: unknown
}

export interface ReportPDFFile {
  fileName: string
  base64Content: string
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
