/**
 * PORTFOLIO TYPES
 *
 * Tipos compartidos del modulo Portfolio.
 * Migrados desde el frontend antiguo UPC-SA-2025-FRONTEND.
 */

export type ProjectPortfolioStatus =
  | 'APPROVED'
  | 'DISAPPROVED'
  | 'PENDING'
  | 'REVIEWED'
  | 'PRE_APPROVED'

export interface PortfolioFileItem {
  id: number
  name: string
  esDirectorio: boolean
  key: string
  ultimaModificacion?: string | Date
  tamano?: number
  tag?: string
  active?: boolean
  // campos auxiliares que aparecen en el codigo antiguo
  dir?: string
  directorio?: boolean
  isDirectory?: boolean
}

export interface PortfolioRouteItem {
  name: string
  dir: string
}

export interface PortfolioRole {
  idRol: number
  nombre?: string
  isAssociated: boolean
}

export interface PortfolioUser {
  usuarioIamId: number | string
  codigo?: string
  email?: string
  nombre?: string
  portfolioConfiguration?: PortfolioConfiguration | string
  [key: string]: unknown
}

export interface PortfolioConfiguration {
  RUTAS?: string[] | string
  [key: string]: unknown
}

export interface PortfolioPermission {
  modalidad: string
  carrera?: string
  anio?: string
  ruta: string
}

export interface ProjectPortfolio {
  id?: number | string
  projectId?: number | string
  code?: string
  name: string
  description?: string
  status?: ProjectPortfolioStatus
  periodoAcademicoId?: number | string
  idPeriodoAcademico?: number | string
  idModalidad?: number
  idEmpresa?: number | string | null
  codigoEmpresa?: string | null
  idCarrera?: number
  isFromUPC?: boolean
  studentOneId?: number | string | null
  studentTwoId?: number | string | null
  problemSolved?: string
  goal?: string
  coautorId?: number | string | null
  consultantId?: number | string | null
  [key: string]: unknown
}

export interface ProjectPortfolioFilter {
  college: string
  periodoAcademicoId?: number | string
  careerId?: number | string | null
  status?: ProjectPortfolioStatus | string | null
  studentCode?: string | null
  IsFromUPC?: boolean | null
  idModality?: number | string
  careersIds?: Array<number | string>
  assignment?: string | null
  courseCode?: string | null
  teacherCode?: string | null
  sectionCode?: string | null
  evaluatorInfo?: unknown
}

export interface PaginatedRequest<TBody> {
  body: TBody
  page: {
    pageNumber: number
    pageSize: number
  }
}

export interface PaginatedResponse<T> {
  items?: T[]
  data?: T[]
  resource?: T[]
  total?: number
  totalItems?: number
  pageNumber?: number
  pageSize?: number
  totalPages?: number
}

export interface S3SizeResponse {
  isLargerThan1GB: boolean
  totalSizeInMB: number | string
  totalSizeInBytes?: number
}

export interface AccessRoute {
  ruta: string
  permitida?: boolean
}

export interface BriefCase {
  id?: number | string
  name: string
  description?: string
  [key: string]: unknown
}

/**
 * Envoltorio estandar de respuestas del backend NestJS.
 * Acepta los dos formatos historicos: { data } y { resource }.
 */
export interface ApiEnvelope<T> {
  success?: boolean
  message?: string
  data?: T
  resource?: T
  error?: unknown
}

export type ApiResponse<T> = ApiEnvelope<T> | T
