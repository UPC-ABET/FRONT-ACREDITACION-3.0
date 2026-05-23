import { CommissionTab } from "./commission-tab.type"
import { PerformanceLevel } from "./performance-level.type"
import { RubricQuestion } from "./rubric-question.type"

export type RubricDetail = {
  id: string
  gradeTypeCode: 'TF' | 'TP' | string
  gradeType: { en: string; es: string }
  isCapstone: boolean
  program: { id: string; code: string; name: { en: string; es: string } }
  course: { id: string; code: string; name: { en: string; es: string } }
  commission: { code: string; name: { en: string; es: string } }
  academicPeriod: { id: string; code: string }
  canEdit: boolean
  hasScores: boolean
  maxScore: number
  performanceLevels: PerformanceLevel[]
  commissions: CommissionTab[]
  questions: RubricQuestion[]
}