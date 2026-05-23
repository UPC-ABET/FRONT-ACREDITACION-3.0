import { RubricResponse } from "../api/dtos"

export type RubricListRow = {
    id: number
    courseLabel: { en: string; es: string }
    periodLabel: number
    gradeTypeLabel: { en: string; es: string }
    rubricTypeLabel: { en: string; es: string }
    isCapstone: boolean
    canEdit: boolean
    raw: RubricResponse
}