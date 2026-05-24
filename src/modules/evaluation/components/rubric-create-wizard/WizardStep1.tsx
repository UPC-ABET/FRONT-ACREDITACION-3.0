'use client'

import { useEffect, useState } from 'react'
import { Select, Button } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { getSchoolFromCookie } from '@/shared/lib/jwt'
import { rubricWizardService } from '../../services/rubricWizardService'
import { studyPlanCoursesService } from '../../services/studyPlanCoursesService'
import type { AcademicPeriodResponse } from '@/modules/academic/api/dtos/response'
import type { StudyPlanCourseResponse } from '@/modules/academic/api/dtos/response'

export interface Step1Data {
  periodId: number
  courseId: number
  studyPlanCourseId: number
  courseName: { en: string; es: string }
  periodCode: string
}

interface WizardStep1Props {
  onNext: (data: Step1Data) => void
}

type SelectOption = { label: string; value: string | number }

function getSpcCourseName(spc: StudyPlanCourseResponse): { en: string; es: string } {
  const raw = spc.course?.name
  if (!raw) return { en: '', es: '' }
  return typeof raw === 'string' ? { en: raw, es: raw } : raw
}

export function WizardStep1({ onNext }: WizardStep1Props) {
  const { t, locale } = useI18n()
  const [periods, setPeriods] = useState<AcademicPeriodResponse[]>([])
  const [spcList, setSpcList] = useState<StudyPlanCourseResponse[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<SelectOption | null>(null)
  const [selectedSpcId, setSelectedSpcId] = useState<SelectOption | null>(null)
  const [loadingPeriods, setLoadingPeriods] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [error, setError] = useState('')

  // Load active periods once
  useEffect(() => {
    rubricWizardService
      .getAcademicPeriods()
      .then((res) => setPeriods(res.data.filter((p) => p.is_active)))
      .catch(() => setError(t('rubrics.wizard.step1.error.loadPeriods')))
      .finally(() => setLoadingPeriods(false))
  }, [t])

  // Load study-plan-courses filtered by period, school and is_evaluate_rubric
  useEffect(() => {
    if (!selectedPeriod) {
      setSpcList([])
      setSelectedSpcId(null)
      return
    }
    const schoolId = getSchoolFromCookie()?.id as number | undefined
    if (!schoolId) {
      setError(t('rubrics.wizard.step1.error.noSchool'))
      return
    }
    setLoadingCourses(true)
    setSelectedSpcId(null)
    setError('')
    studyPlanCoursesService
      .getByFilters({
        academic_period_id: Number(selectedPeriod.value),
        school_id: schoolId,
        extra: { is_evaluate_rubric: true },
        is_active: true,
      })
      .then((res) => setSpcList(res.data))
      .catch(() => setError(t('rubrics.wizard.step1.error.loadCourses')))
      .finally(() => setLoadingCourses(false))
  }, [selectedPeriod, t])

  const handleNext = () => {
    if (!selectedPeriod || !selectedSpcId) return
    const spc = spcList.find((s) => s.id === Number(selectedSpcId.value))
    const period = periods.find((p) => p.id === Number(selectedPeriod.value))
    if (!spc || !period) return
    onNext({
      periodId: period.id,
      courseId: spc.course_id,
      studyPlanCourseId: spc.id,
      courseName: getSpcCourseName(spc),
      periodCode: period.code,
    })
  }

  const periodOptions: SelectOption[] = periods.map((p) => ({ label: p.code, value: p.id }))
  const courseOptions: SelectOption[] = spcList.map((s) => ({
    label: getSpcCourseName(s)[locale] || String(s.course_id),
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
          onChange={(_, v) => setSelectedPeriod(v as SelectOption | null)}
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
          onChange={(_, v) => setSelectedSpcId(v as SelectOption | null)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button variant="primary" disabled={!canContinue} onClick={handleNext}>
          {t('rubrics.wizard.step1.next')}
        </Button>
      </div>
    </div>
  )
}
