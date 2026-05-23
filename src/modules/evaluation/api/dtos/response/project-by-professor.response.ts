export type ProjectEvaluatorInfoResponse = {
  id: number
  professor_id: number
  first_name: string
  last_name: string
  email: string
  evaluator_type: string
}

export type ProjectStudentInfoResponse = {
  id: number
  first_name: string
  last_name: string
  email: string
  student_code: string
}

export type ProjectByProfessorResponse = {
  project_id: number
  project_code: string
  project_name: { en: string; es: string }
  evaluation_date: string
  course_name: string
  evaluator: ProjectEvaluatorInfoResponse
  students: ProjectStudentInfoResponse[]
}

export {}
