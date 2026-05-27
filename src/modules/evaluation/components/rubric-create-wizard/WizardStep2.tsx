'use client'

import { useMemo, useState } from 'react'
import { Select, Button, Badge } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { useTypesByGroupCode } from '@/modules/core/hooks'
import { useCourseOutcomeMappings } from '@/modules/academic/hooks'
import type { Step1Data } from './WizardStep1'
import { TYPE_GROUP_CODES, TYPE_CODES } from '@/modules/core'

const GRADE_TYPE_GROUP = TYPE_GROUP_CODES.GRADE_TYPE
const RUBRIC_TYPE_GROUP = TYPE_GROUP_CODES.RUBRIC_TYPE
const OUTCOME_TYPE_GROUP = TYPE_GROUP_CODES.OUTCOME_TYPE
const VERIFICATION_CODE = TYPE_CODES.OUTCOME_TYPE.VERIFICATION
const CONTROL_CODE = TYPE_CODES.OUTCOME_TYPE.CONTROL
const PARTIAL_EVAL_CODE = TYPE_CODES.GRADE_TYPE.PARTIAL
const FINAL_EVAL_CODE = TYPE_CODES.GRADE_TYPE.FINAL
const CAPSTONE_RUBRIC_CODE = TYPE_CODES.RUBRIC_TYPE.CAPSTONE

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

type AnyOption = { label: string; value: string | number }

export function WizardStep2({ step1, onBack, onNext }: WizardStep2Props) {
  const { t } = useI18n()
  const [selectedGradeType, setSelectedGradeType] = useState<AnyOption | null>(null)

  const { data: gradeTypes = [], isLoading: loadingGrade } = useTypesByGroupCode(GRADE_TYPE_GROUP)
  const { data: rubricTypes = [], isLoading: loadingRubric } = useTypesByGroupCode(RUBRIC_TYPE_GROUP)
  const { data: outcomeTypes = [], isLoading: loadingOutcome } = useTypesByGroupCode(OUTCOME_TYPE_GROUP)

  const loadingTypes = loadingGrade || loadingRubric || loadingOutcome

  const selectedGradeTypeObj = useMemo(
    () => gradeTypes.find((gt) => gt.id === Number(selectedGradeType?.value)) ?? null,
    [gradeTypes, selectedGradeType?.value],
  )

  const isEaOrEb = useMemo(
    () =>
      selectedGradeTypeObj != null &&
      (selectedGradeTypeObj.code === PARTIAL_EVAL_CODE ||
        selectedGradeTypeObj.code === FINAL_EVAL_CODE),
    [selectedGradeTypeObj],
  )

  const mappingFilters = useMemo(
    () => ({ study_plan_course_id: step1.studyPlanCourseId, is_active: true }),
    [step1.studyPlanCourseId],
  )

  const { data: mappings = [], isLoading: loadingMappings } = useCourseOutcomeMappings(
    mappingFilters,
    { enabled: isEaOrEb && outcomeTypes.length > 0 },
  )

  const { determinedRubricType, capstoneOutcomeIds } = useMemo(() => {
    if (!selectedGradeTypeObj || rubricTypes.length === 0 || outcomeTypes.length === 0) {
      return { determinedRubricType: null, capstoneOutcomeIds: [] }
    }

    if (!isEaOrEb) {
      return {
        determinedRubricType: rubricTypes.find((rt) => rt.code !== CAPSTONE_RUBRIC_CODE) ?? null,
        capstoneOutcomeIds: [],
      }
    }

    if (loadingMappings) {
      return { determinedRubricType: null, capstoneOutcomeIds: [] }
    }

    const verificationTypeId = outcomeTypes.find((ot) => ot.code === VERIFICATION_CODE)?.id
    const controlTypeId = outcomeTypes.find((ot) => ot.code === CONTROL_CODE)?.id
    const relevantIds = new Set([verificationTypeId, controlTypeId].filter(Boolean) as number[])

    const hasVerification =
      verificationTypeId != null &&
      mappings.some((m) => m.outcome_type_id === verificationTypeId)

    if (hasVerification) {
      const relevant = mappings.filter((m) => relevantIds.has(m.outcome_type_id))
      return {
        determinedRubricType: rubricTypes.find((rt) => rt.code === CAPSTONE_RUBRIC_CODE) ?? null,
        capstoneOutcomeIds: relevant.map((m) => m.outcome_id),
      }
    }

    return {
      determinedRubricType: rubricTypes.find((rt) => rt.code !== CAPSTONE_RUBRIC_CODE) ?? null,
      capstoneOutcomeIds: [],
    }
  }, [selectedGradeTypeObj, isEaOrEb, rubricTypes, outcomeTypes, mappings, loadingMappings])

  const handleNext = () => {
    if (!selectedGradeTypeObj || !determinedRubricType) return
    onNext({
      gradeTypeId: selectedGradeTypeObj.id,
      gradeTypeCode: selectedGradeTypeObj.code,
      gradeTypeName: selectedGradeTypeObj.name,
      rubricTypeId: determinedRubricType.id,
      rubricTypeCode: determinedRubricType.code,
      isCapstone: determinedRubricType.code === CAPSTONE_RUBRIC_CODE,
      capstoneOutcomeIds,
    })
  }

  const gradeTypeOptions: AnyOption[] = gradeTypes.map((gt) => ({
    label: `${gt.name.es} — ${gt.description.es}`,
    value: gt.id,
  }))

  const canContinue =
    !!selectedGradeType && !!determinedRubricType && !loadingMappings

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
        onChange={(_, v) => setSelectedGradeType(Array.isArray(v) ? (v[0] ?? null) : v)}
      />

      {loadingMappings && (
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

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>{t('rubrics.wizard.step2.back')}</Button>
        <Button variant="primary" disabled={!canContinue} onClick={handleNext}>{t('rubrics.wizard.step2.next')}</Button>
      </div>
    </div>
  )
}
