'use client'

import { useEffect, useState } from 'react'
import { Select, Button, Badge } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { rubricWizardService } from '../../services/rubricWizardService'
import type { TypeItemResponse } from '@/modules/academic'
import type { Step1Data } from './WizardStep1'
import { GRADE_CODES, OUTCOME_CODES, RUBRIC_CODES } from '../../constants/type-codes'

const GRADE_TYPE_GROUP = GRADE_CODES.TYPE_GROUP
const RUBRIC_TYPE_GROUP = RUBRIC_CODES.TYPE_GROUP
const OUTCOME_TYPE_GROUP = OUTCOME_CODES.TYPE_GROUP
const VERIFICATION_CODE = OUTCOME_CODES.VERIFICATION
const CONTROL_CODE = OUTCOME_CODES.CONTROL
const PARTIAL_EVAL_CODE = GRADE_CODES.PARTIAL
const FINAL_EVAL_CODE = GRADE_CODES.FINAL
const CAPSTONE_RUBRIC_CODE = RUBRIC_CODES.CAPSTONE

export interface Step2Data {
  gradeTypeId: number
  gradeTypeCode: string
  gradeTypeName: { en: string; es: string }
  rubricTypeId: number
  rubricTypeCode: string
  isCapstone: boolean
  capstoneOutcomeIds: number[]
}

interface WizardStep2Props {
  step1: Step1Data
  onBack: () => void
  onNext: (data: Step2Data) => void
}

type SelectOption = { label: string; value: string | number }

export function WizardStep2({ step1, onBack, onNext }: WizardStep2Props) {
  const { t } = useI18n()
  const [gradeTypes, setGradeTypes] = useState<TypeItemResponse[]>([])
  const [rubricTypes, setRubricTypes] = useState<TypeItemResponse[]>([])
  const [outcomeTypes, setOutcomeTypes] = useState<TypeItemResponse[]>([])
  const [selectedGradeType, setSelectedGradeType] = useState<SelectOption | null>(null)
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingOutcomes, setLoadingOutcomes] = useState(false)
  const [determinedRubricType, setDeterminedRubricType] = useState<TypeItemResponse | null>(null)
  const [capstoneOutcomeIds, setCapstoneOutcomeIds] = useState<number[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      rubricWizardService.getTypesByGroupCode(GRADE_TYPE_GROUP),
      rubricWizardService.getTypesByGroupCode(RUBRIC_TYPE_GROUP),
      rubricWizardService.getTypesByGroupCode(OUTCOME_TYPE_GROUP),
    ])
      .then(([gradeRes, rubricRes, outcomeTypeRes]) => {
        setGradeTypes(gradeRes.data)
        setRubricTypes(rubricRes.data)
        setOutcomeTypes(outcomeTypeRes.data)
      })
      .catch(() => setError(t('rubrics.wizard.step2.error.loadTypes')))
      .finally(() => setLoadingTypes(false))
  }, [t])

  useEffect(() => {
    if (!selectedGradeType || rubricTypes.length === 0 || outcomeTypes.length === 0) {
      setDeterminedRubricType(null)
      setCapstoneOutcomeIds([])
      return
    }

    const gradeType = gradeTypes.find((t) => t.id === Number(selectedGradeType.value))
    if (!gradeType) return

    const isEaOrEb = gradeType.code === PARTIAL_EVAL_CODE || gradeType.code === FINAL_EVAL_CODE

    if (!isEaOrEb) {
      setDeterminedRubricType(rubricTypes.find((t) => t.code !== CAPSTONE_RUBRIC_CODE)!)
      setCapstoneOutcomeIds([])
      return
    }

    setLoadingOutcomes(true)
    setDeterminedRubricType(null)
    setCapstoneOutcomeIds([])

    const verificationTypeId = outcomeTypes.find((ot) => ot.code === VERIFICATION_CODE)?.id
    const controlTypeId = outcomeTypes.find((ot) => ot.code === CONTROL_CODE)?.id
    const relevantOutcomeTypeIds = new Set([verificationTypeId, controlTypeId].filter(Boolean) as number[])

    rubricWizardService
      .getCourseOutcomeMappings({ study_plan_course_id: step1.studyPlanCourseId, is_active: true })
      .then((res) => {
        const relevant = res.data.filter((m) => relevantOutcomeTypeIds.has(m.outcome_type_id))
        const hasVerification = verificationTypeId != null &&
          res.data.some((m) => m.outcome_type_id === verificationTypeId)

        if (hasVerification) {
          setDeterminedRubricType(rubricTypes.find((rt) => rt.code === CAPSTONE_RUBRIC_CODE)!)
          setCapstoneOutcomeIds(relevant.map((m) => m.outcome_id))
        } else {
          setDeterminedRubricType(rubricTypes.find((rt) => rt.code !== CAPSTONE_RUBRIC_CODE)!)
          setCapstoneOutcomeIds([])
        }
      })
      .catch(() => setError(t('rubrics.wizard.step2.error.verifyOutcomes')))
      .finally(() => setLoadingOutcomes(false))
  }, [selectedGradeType, gradeTypes, rubricTypes, outcomeTypes, step1.studyPlanCourseId, t])

  const handleNext = () => {
    if (!selectedGradeType || !determinedRubricType) return
    const gradeType = gradeTypes.find((gt) => gt.id === Number(selectedGradeType.value))!
    onNext({
      gradeTypeId: gradeType.id,
      gradeTypeCode: gradeType.code,
      gradeTypeName: gradeType.name,
      rubricTypeId: determinedRubricType.id,
      rubricTypeCode: determinedRubricType.code,
      isCapstone: determinedRubricType.code === CAPSTONE_RUBRIC_CODE,
      capstoneOutcomeIds,
    })
  }

  const gradeTypeOptions: SelectOption[] = gradeTypes.map((gt) => ({
    label: `${gt.name.es} — ${gt.description.es}`,
    value: gt.id,
  }))

  const canContinue = !!selectedGradeType && !!determinedRubricType && !loadingOutcomes

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{t('rubrics.wizard.step2.title')}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t('rubrics.wizard.step2.subtitle')}</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
        <span className="font-medium text-zinc-800">{step1.periodCode}</span>
        {' · '}
        <span>{step1.courseName.es}</span>
      </div>

      <Select
        label={t('rubrics.wizard.step2.gradeTypeLabel')}
        placeholder={loadingTypes ? t('rubrics.wizard.step2.gradeTypeLoading') : t('rubrics.wizard.step2.gradeTypePlaceholder')}
        options={gradeTypeOptions}
        value={selectedGradeType}
        isDisabled={loadingTypes}
        isSearchable
        onChange={(_, v) => setSelectedGradeType(v as SelectOption | null)}
      />

      {loadingOutcomes && (
        <p className="text-sm text-zinc-500">{t('rubrics.wizard.step2.verifyingOutcomes')}</p>
      )}

      {determinedRubricType && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">{t('rubrics.wizard.step2.rubricTypeLabel')}</span>
          {determinedRubricType.code === CAPSTONE_RUBRIC_CODE ? (
            <Badge variant="success">Capstone</Badge>
          ) : (
            <Badge variant="outline">No Capstone</Badge>
          )}
          <span className="text-xs text-zinc-500">{determinedRubricType.name.es}</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>{t('rubrics.wizard.step2.back')}</Button>
        <Button variant="primary" disabled={!canContinue} onClick={handleNext}>{t('rubrics.wizard.step2.next')}</Button>
      </div>
    </div>
  )
}
