import { CriteriaItem } from "./criteria-item.type"














export type SaveCriteriaPayload = {
  criteriaId: string | null
  description: string
}

export type SaveCriteriaResponse = {
  criteria: CriteriaItem
  updatedOutcomeScore: number
  updatedRubricMaxScore: number
}

export type PatchCriteriaDescriptionResponse = {
  criteria: CriteriaItem
}

export type DeleteCriteriaResponse = {
  updatedOutcomeScore: number
  updatedRubricMaxScore: number
}
