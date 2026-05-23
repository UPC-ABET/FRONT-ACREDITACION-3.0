/**
 * PROJECT PORTFOLIO SERVICE
 *
 * Wrapper sobre los endpoints REST de /project-portfolios del backend NestJS.
 * Migrado desde UPC-SA-2025-FRONTEND/src/client/ThesisProjects/ThesisProjectsService.jsx
 * conservando los mismos nombres de parametros y la misma forma del payload
 * (incluyendo el envoltorio { body, page } usado por get-all y export).
 *
 * Todas las llamadas pasan por portfolioApiClient (fetch + bearer token).
 */

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  apiUploadFormData,
} from './portfolioApiClient'
import type {
  PaginatedRequest,
  ProjectPortfolio,
  ProjectPortfolioStatus,
} from '../types'

const BASE = '/project-portfolios'

// ───────────────────────────── PAYLOADS ─────────────────────────────

export interface GetProjectsPortfoliosPayload {
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
  pageNumber?: number
  pageSize?: number
}

export interface CreateProjectPortfolioPayload {
  description: string
  name: string
  periodoAcademicoId: number | string
  idModalidad: number
  idEmpresa?: number | string | null
  codigoEmpresa?: string | null
  idCarrera: number
  isFromUPC?: boolean
}

export interface UpdateProjectPortfolioPayload {
  projectId: number | string
  code?: string
  name: string
  description?: string
  idPeriodoAcademico: number | string
  idModalidad: number
  idEmpresa?: number | string | null
  codigoEmpresa?: string | null
  idCarrera: number
  isFromUPC?: boolean
}

export interface UpdateProjectPortfolioManagerPayload {
  projectId: number | string
  name: string
  studentOneId?: number | string | null
  studentTwoId?: number | string | null
  problemSolved?: string
  goal?: string
  coautorId?: number | string | null
  consultantId?: number | string | null
}

export interface AutoAssignPartnerPayload {
  modalityId: number | string
  courseCode: string
}

export interface MigrateProjectPortfoliosPayload {
  courseCode: string
  newCourseCode: string
  newAcademicPeriodId: number | string
  modalityId: number | string
}

export interface ManagementAssignPayload {
  studentOneId: number | string
  studentTwoId?: number | string | null
  courseCode: string
  projectId: number | string
}

export interface ExportProjectPortfoliosPayload extends GetProjectsPortfoliosPayload {
  evaluatorInfo?: unknown
}

// ───────────────────────────── HELPERS ─────────────────────────────

function withCollege(college: string, extras: Record<string, string> = {}): string {
  const params = new URLSearchParams({ college, ...extras })
  return params.toString()
}

function paginate<TBody>(body: TBody, pageNumber = -1, pageSize = -1): PaginatedRequest<TBody> {
  return {
    body,
    page: { pageNumber, pageSize },
  }
}

// ───────────────────────────── FUNCIONES ─────────────────────────────

export function listRoles(params: {
  idUsuario: number | string
  escuela?: string
  escuelaUsuario: string
}) {
  const search = new URLSearchParams({
    idUsuario: String(params.idUsuario),
    escuela: params.escuela ?? 'IAM',
    escuelaUsuario: params.escuelaUsuario,
  })
  return apiGet(`${BASE}/listar-roles?${search.toString()}`)
}

export function getModalitiesByUser(params: {
  college: string
  idUsuario?: number | string
}) {
  const search = new URLSearchParams({ college: params.college })
  if (params.idUsuario !== undefined) search.append('idUsuario', String(params.idUsuario))
  return apiGet(`${BASE}/modalidades?${search.toString()}`)
}

export function getCareersBySchool(params: { college: string; idModality?: number | string }) {
  const search = new URLSearchParams({ college: params.college })
  if (params.idModality !== undefined) search.append('idModality', String(params.idModality))
  return apiGet(`${BASE}/carreras?${search.toString()}`)
}

export function getAccess(params: { college: string; idUsuario?: number | string }) {
  const search = new URLSearchParams({ college: params.college })
  if (params.idUsuario !== undefined) search.append('idUsuario', String(params.idUsuario))
  return apiGet(`${BASE}/access?${search.toString()}`)
}

export function getProjectsPortfolios(payload: GetProjectsPortfoliosPayload) {
  const {
    pageNumber = -1,
    pageSize = -1,
    careersIds = [],
    IsFromUPC = true,
    sectionCode = null,
    ...rest
  } = payload

  const body = {
    college: rest.college,
    periodoAcademicoId: rest.periodoAcademicoId,
    careerId: rest.careerId,
    status: rest.status,
    studentCode: rest.studentCode,
    isFromUPC: IsFromUPC,
    idModality: rest.idModality,
    careersIds,
    assignment: rest.assignment,
    courseCode: rest.courseCode,
    teacherCode: rest.teacherCode,
    sectionCode,
  }

  return apiPost(`${BASE}/get-all`, paginate(body, pageNumber, pageSize))
}

export function getProjectPortfolio(id: number | string, college: string) {
  const search = new URLSearchParams({ id: String(id), college })
  return apiGet(`${BASE}/${id}?${search.toString()}`)
}

export function createProjectPortfolio(
  payload: CreateProjectPortfolioPayload,
  college: string
) {
  const body = { isFromUPC: true, ...payload }
  return apiPost(`${BASE}?${withCollege(college)}`, body)
}

export function updateProjectPortfolio(
  payload: UpdateProjectPortfolioPayload,
  college: string
) {
  const body = { isFromUPC: true, ...payload }
  return apiPut(`${BASE}?${withCollege(college)}`, body)
}

export function deleteProjectPortfolio(college: string, idProject: number | string) {
  return apiDelete(`${BASE}/${idProject}?${withCollege(college)}`)
}

export function getCompanies(
  academicPeriodId: number | string,
  modalityId: number | string,
  college: string
) {
  return apiGet(
    `${BASE}/companies/${academicPeriodId}/${modalityId}?${withCollege(college)}`
  )
}

export function getProjectsByTeacher(teacherId: number | string, college: string) {
  const search = new URLSearchParams({ teacherId: String(teacherId), college })
  return apiGet(`${BASE}/total-teacher-projects/${teacherId}?${search.toString()}`)
}

export function getTeachersWithProject(
  modalityId: number | string,
  college: string
) {
  const search = new URLSearchParams({ modalityId: String(modalityId), college })
  return apiGet(`${BASE}/teachers/${modalityId}?${search.toString()}`)
}

export function updateProjectPortfolioManager(
  payload: UpdateProjectPortfolioManagerPayload,
  college: string
) {
  return apiPut(`${BASE}/update-manager?${withCollege(college)}`, payload)
}

export function autoAssignPartner(payload: AutoAssignPartnerPayload, college: string) {
  return apiPost(`${BASE}/auto-assign-partner?${withCollege(college)}`, payload)
}

export function migrateProjectPortfolios(
  payload: MigrateProjectPortfoliosPayload,
  college: string
) {
  return apiPut(`${BASE}/migrate?${withCollege(college)}`, payload)
}

export function managementAssign(payload: ManagementAssignPayload, college: string) {
  return apiPost(`${BASE}/management-assign?${withCollege(college)}`, payload)
}

export function exportProjectPortfolios(payload: ExportProjectPortfoliosPayload) {
  const {
    pageNumber = -1,
    pageSize = -1,
    careersIds = [],
    IsFromUPC = null,
    sectionCode = null,
    evaluatorInfo,
    ...rest
  } = payload

  const body = {
    college: rest.college,
    periodoAcademicoId: rest.periodoAcademicoId,
    careerId: rest.careerId,
    status: rest.status,
    studentCode: rest.studentCode,
    isFromUPC: IsFromUPC,
    idModality: rest.idModality,
    careersIds,
    assignment: rest.assignment,
    courseCode: rest.courseCode,
    sectionCode,
    evaluatorInfo,
  }

  return apiPost(`${BASE}/export`, paginate(body, pageNumber, pageSize))
}

/**
 * Descarga la plantilla de carga masiva. Devuelve la respuesta cruda
 * (igual que el frontend antiguo, que la convertia a Blob por su cuenta).
 */
export function downloadProjectsTemplate() {
  return apiGet(`${BASE}/bulk-upload-template`)
}

/**
 * Descarga la plantilla de carga masiva como archivo (variante "file").
 */
export function bulkUploadTemplate() {
  return apiGet(`${BASE}/bulk-upload-template-file`)
}

/**
 * Carga masiva basica (proyectos nuevos).
 */
export function bulkUpload(params: {
  periodoAcademicoId: number | string
  college: string
  IdModalidad: number | string
  file: File
}) {
  const formData = new FormData()
  formData.append('file', params.file)
  return apiUploadFormData(
    `${BASE}/bulk-upload/${params.periodoAcademicoId}/${params.college}/${params.IdModalidad}`,
    formData
  )
}

/**
 * Carga masiva con curso (variante "filled").
 */
export function bulkUploadFilled(params: {
  college: string
  periodoAcademicoId: number | string
  IdModalidad: number | string
  courseCode: string
  file: File
}) {
  const formData = new FormData()
  formData.append('file', params.file)
  return apiUploadFormData(
    `${BASE}/bulk-upload-filled/${params.college}/${params.periodoAcademicoId}/${params.IdModalidad}/${params.courseCode}`,
    formData
  )
}

/**
 * Migracion masiva desde base de datos (POST /migrate-from-database).
 */
export function migrateFromDatabase(payload: unknown) {
  return apiPost(`${BASE}/migrate-from-database`, payload)
}

/**
 * Desasignar un estudiante de un proyecto.
 */
export function unassignStudent(projectPortfolioId: number | string, studentId: number | string) {
  return apiDelete(`${BASE}/unassign-student/${projectPortfolioId}/${studentId}`)
}

// ───────────────────────── BARREL EXPORT ─────────────────────────

export const projectPortfolioService = {
  listRoles,
  getModalitiesByUser,
  getCareersBySchool,
  getAccess,
  getProjectsPortfolios,
  getProjectPortfolio,
  createProjectPortfolio,
  updateProjectPortfolio,
  deleteProjectPortfolio,
  getCompanies,
  getProjectsByTeacher,
  getTeachersWithProject,
  updateProjectPortfolioManager,
  autoAssignPartner,
  migrateProjectPortfolios,
  managementAssign,
  exportProjectPortfolios,
  downloadProjectsTemplate,
  bulkUploadTemplate,
  bulkUpload,
  bulkUploadFilled,
  migrateFromDatabase,
  unassignStudent,
}

export type ProjectPortfolioService = typeof projectPortfolioService

export type { ProjectPortfolio }
