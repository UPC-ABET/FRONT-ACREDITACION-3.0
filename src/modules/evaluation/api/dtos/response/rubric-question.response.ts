import { RubricQuestionCriteriaResponse } from "./rubric-question-criteria.response"

export type RubricQuestionResponse = {
  id: number
  text: string
  outcomeId: number
  criterias?: RubricQuestionCriteriaResponse[]
}

export {}
