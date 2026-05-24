export type StudentEvaluationResponse = {
  evaluator_id: number
  qualification_status_type_id: number
}

export type ProjectDetailsStudentResponse = {
  id: number
  student_id: number
  first_name: string
  last_name: string
  email: string
  student_code: string
  total_grade: number | null
  evaluations: StudentEvaluationResponse[] | undefined
}

export type ProjectDetailsEvaluatorResponse = {
  id: number
  professor_id: number
  professor_first_name: string
  professor_last_name: string
  professor_email: string
  evaluator_type_id: number
  evaluator_type_name: { en: string; es: string }
}

export type CriteriaScoreResponse = {
  student_id: number
  evaluator_id: number
  score: number
  commentaries: { en: string; es: string }
}

export type RubricCriteriaDetailsResponse = {
  id: number
  text: { en: string; es: string }
  min_value: string
  max_value: string
  scores: CriteriaScoreResponse[]
}

export type RubricQuestionDetailsResponse = {
  id: number
  text: { en: string; es: string }
  outcomeId: number | null
  criterias: RubricCriteriaDetailsResponse[]
}

export type ProjectDetailsResponse = {
  project: {
    id: number
    code: string
    name: { en: string; es: string }
    description: { en: string; es: string }
  }
  academic_period: {
    id: number
    modality_type_id: number
    code: string
  } | null
  students: ProjectDetailsStudentResponse[]
  evaluators?: ProjectDetailsEvaluatorResponse[]
  rubric: {
    rubric: {
      id: number
      rubric_type: { id: number; code: string; name: { en: string; es: string } }
      grade_type: { id: number; code: string; name: { en: string; es: string } }
    }
    course: {
      id: number
      name: { en: string; es: string }
      description: { en: string; es: string }
    }
    outcomes: {
      id: number
      code: string
      name: { en: string; es: string }
      description: { en: string; es: string }
      questionIds: number[]
    }[]
    questions: RubricQuestionDetailsResponse[]
  }
}
