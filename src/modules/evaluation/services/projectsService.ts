import { ApiResponse } from "@/shared";
import { buildJsonHeaders } from '@/shared/lib'
import { FilterProjectDto } from '../api/dtos/request'
import { ProjectByProfessorResponse, ProjectDetailsResponse, ProjectResponse } from '../api/dtos/response'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: buildJsonHeaders(options?.headers),
    ...options,
  })
  if (!res.ok) throw new Error(`[${res.status}] ${res.statusText} — ${url}`)
  return (res.json() as unknown) as T
}

export const projectsService = {
  create(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/create`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  createFull(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/create-full`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  getByEvaluator(evaluatorId: string | number): Promise<ApiResponse<any[]>> {
    return request(`${BASE_URL}/projects/evaluator/${evaluatorId}`)
  },

  getByProfessor(
    professorId: string | number,
    params?: {
      academicPeriodId?: number
      schoolId?: number
      gradeTypeId?: number
    },
  ): Promise<ApiResponse<ProjectByProfessorResponse[]>> {
    const qs = new URLSearchParams()
    if (params?.academicPeriodId != null) qs.set('academicPeriodId', String(params.academicPeriodId))
    if (params?.schoolId != null) qs.set('schoolId', String(params.schoolId))
    if (params?.gradeTypeId != null) qs.set('gradeTypeId', String(params.gradeTypeId))
    const query = qs.toString()
    return request(`${BASE_URL}/projects/professor/${professorId}${query ? `?${query}` : ''}`)
  },

  getById(projectId: string | number): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/project/${projectId}`)
  },

  getDetails(
    projectId: string | number,
    params?: {
      gradeTypeId?: number
      rubricTypeId?: number
      isEvaluationMode?: boolean
    },
  ): Promise<ApiResponse<ProjectDetailsResponse>> {
    const qs = new URLSearchParams()
    if (params?.isEvaluationMode) qs.set('is_evaluation_mode', String(params.isEvaluationMode))
    if (params?.gradeTypeId != null) qs.set('grade_type_id', String(params.gradeTypeId))
    if (params?.rubricTypeId != null) qs.set('rubric_type_id', String(params.rubricTypeId))
    return request(`${BASE_URL}/projects/project/${projectId}?${qs.toString()}`)
  },

  update(
    id: string | number,
    body: {
      code?: string
      name?: { es: string; en: string }
      description?: { es: string; en: string }
      is_active?: boolean
    },
  ): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/update/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string | number): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/delete/${id}`, { method: 'DELETE' })
  },

  getAll(): Promise<ApiResponse<any[]>> {
    return request(`${BASE_URL}/projects/get-all`)
  },

  getByFilters(filters: FilterProjectDto = {}): Promise<ApiResponse<ProjectResponse[]>> {
    return request(`${BASE_URL}/projects/get-by-filters`, {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  },

  addStudents(
    projectId: string | number,
    studentSectionEnrollmentIds: number[],
  ): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/project/${projectId}/students`, {
      method: 'POST',
      body: JSON.stringify({ student_section_enrollment_ids: studentSectionEnrollmentIds }),
    })
  },

  createStudent(body: {
    project_id: number
    student_section_enrollment_id: number
    is_active: true
  }): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/project-students/create`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  removeStudent(projectStudentId: number): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/project-students/delete/${projectStudentId}`, {
      method: 'DELETE',
    })
  },

  addEvaluators(
    projectId: string | number,
    professorIds: number[],
  ): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/project/${projectId}/evaluators`, {
      method: 'POST',
      body: JSON.stringify({ evaluator_professor_ids: professorIds }),
    })
  },

  removeEvaluator(projectEvaluatorId: number): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/project-evaluators/delete/${projectEvaluatorId}`, {
      method: 'DELETE',
    })
  },

  createEvaluator(body: {
    project_id: number
    professor_id: number
    evaluator_type_id: number
    is_active: true
  }): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/project-evaluators/create`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}
