'use client'

import { useMemo, useState } from 'react'
import { Select, Button } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { getSchoolFromCookie } from '@/shared/lib/jwt'
import { useAcademicPeriods, useStudyPlanCourses } from '@/modules/academic/hooks'
import type { StudyPlanCourseResponse } from '@/modules/academic/api/dtos/response'

export interface Step1Data {
  periodId: number
  courseId: number
  studyPlanCourseId: number
  studyPlanAcademicPeriodId: number
  courseName: { en: string; es: string }
  periodCode: string
}

interface WizardStep1Props {
  onNext: (data: Step1Data) => void
}

type AnyOption = { label: string; value: string | number }

function getSpcCourseName(spc: StudyPlanCourseResponse): { en: string; es: string } {
  const raw = spc.course?.name
  if (!raw) return { en: '', es: '' }
  return typeof raw === 'string' ? { en: raw, es: raw } : raw
}

export function WizardStep1({ onNext }: WizardStep1Props) {
  const { t, locale } = useI18n()
  const schoolId = getSchoolFromCookie()?.id as number | undefined

  const [selectedPeriod, setSelectedPeriod] = useState<AnyOption | null>(null)
  const [selectedSpcId, setSelectedSpcId] = useState<AnyOption | null>(null)

  const { data: periods = [], isLoading: loadingPeriods } = useAcademicPeriods({ is_active: true })

  const spcFilters = useMemo(
    () => ({
      academic_period_id: Number(selectedPeriod?.value ?? 0),
      school_id: schoolId,
      extra: { is_evaluate_rubric: true },
      is_active: true,
    }),
    [selectedPeriod?.value, schoolId],
  )

  const { data: spcList = [], isLoading: loadingCourses } = useStudyPlanCourses(spcFilters, {
    enabled: !!selectedPeriod && !!schoolId,
  })

  const handlePeriodChange = (_: string | undefined, v: AnyOption | AnyOption[] | null) => {
    const single = Array.isArray(v) ? (v[0] ?? null) : v
    setSelectedPeriod(single)
    setSelectedSpcId(null)
  }

  const handleNext = () => {
    if (!selectedPeriod || !selectedSpcId) return
    const spc = spcList.find((s) => s.id === Number(selectedSpcId.value))
    const period = periods.find((p) => p.id === Number(selectedPeriod.value))
    if (!spc || !period) return
    onNext({
      periodId: period.id,
      courseId: spc.course?.id ?? spc.course_id,
      studyPlanCourseId: spc.id,
      studyPlanAcademicPeriodId: spc.study_plan_academic_period_id,
      courseName: getSpcCourseName(spc),
      periodCode: period.code,
    })
  }

  const periodOptions: AnyOption[] = periods.map((p) => ({ label: p.code, value: p.id }))
  const courseOptions: AnyOption[] = spcList.map((s) => ({
    label: getSpcCourseName(s)[locale] || String(s.course?.id ?? s.course_id),
    value: s.id,
  }))

  const canContinue = !!selectedPeriod && !!selectedSpcId

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{t('rubrics.wizard.step1.title')}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t('rubrics.wizard.step1.subtitle')}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Select
          label={t('rubrics.wizard.step1.periodLabel')}
          placeholder={loadingPeriods ? t('rubrics.wizard.step1.periodLoading') : t('rubrics.wizard.step1.periodPlaceholder')}
          options={periodOptions}
          value={selectedPeriod}
          isDisabled={loadingPeriods}
          isSearchable
          onChange={handlePeriodChange}
        />

        <Select
          label={t('rubrics.wizard.step1.courseLabel')}
          placeholder={
            !selectedPeriod
              ? t('rubrics.wizard.step1.courseSelectPeriodFirst')
              : loadingCourses
                ? t('rubrics.wizard.step1.courseLoading')
                : spcList.length === 0
                  ? t('rubrics.wizard.step1.courseNoOptions')
                  : t('rubrics.wizard.step1.coursePlaceholder')
          }
          options={courseOptions}
          value={selectedSpcId}
          isDisabled={!selectedPeriod || loadingCourses || spcList.length === 0}
          isSearchable
          onChange={(_, v) => setSelectedSpcId(Array.isArray(v) ? (v[0] ?? null) : v)}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="primary" disabled={!canContinue} onClick={handleNext}>
          {t('rubrics.wizard.step1.next')}
        </Button>
      </div>
    </div>
  )
}
