import { CriteriaItem } from "./criteria-item.type"

export type OutcomeQuestion = {
  id: string
  questionText: { en: string; es: string }
  criteria: CriteriaItem[]
}

export type OutcomeWithCriteria = {
  id: string
  outcomeCode: string
  outcomeDescription: { en: string; es: string }
  outcomeType: 'verificacion' | 'control'
  questions: OutcomeQuestion[]
}
