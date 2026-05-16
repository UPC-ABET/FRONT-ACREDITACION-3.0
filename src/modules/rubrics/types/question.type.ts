import { RubricCriteria } from "./criteria.type"

export type RubricQuestion = {
  id?: number
  rubric_id?: number
  outcome_id?: number | null
  question: string
  is_active?: boolean
  criterias?: RubricCriteria[]
}

export {}
