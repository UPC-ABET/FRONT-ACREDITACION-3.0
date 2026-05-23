import { QuestionCriteria } from "./question-criteria.type"

export type RubricQuestion = {
  id: string | null
  order: number
  questionText: { en: string; es: string }
  criteria: QuestionCriteria[]
}