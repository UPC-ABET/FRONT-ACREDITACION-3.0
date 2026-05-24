'use client'

import { useEffect, useState } from 'react'
import { Select, Button } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { getSchoolFromCookie } from '@/shared/lib/jwt'
import { rubricWizardService } from '../../services/rubricWizardService'
import type { AcademicPeriodResponse, CourseResponse } from '@/modules/academic/api/dtos/response'

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

export function WizardStep1({ onNext }: WizardStep1Props) {
  const { t } = useI18n()
  const [periods, setPeriods] = useState<AcademicPeriodResponse[]>([])
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<SelectOption | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<SelectOption | null>(null)
  const [loadingPeriods, setLoadingPeriods] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingSpc, setLoadingSpc] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    rubricWizardService
      .getAcademicPeriods()
      .then((res) => setPeriods(res.data.filter((p) => p.is_active)))
      .catch(() => setError(t('rubrics.wizard.step1.error.loadPeriods')))
      .finally(() => setLoadingPeriods(false))
  }, [t])

  useEffect(() => {
    if (!selectedPeriod) {
      setCourses([])
      setSelectedCourse(null)
      return
    }
    const school = getSchoolFromCookie()
    const schoolId = school?.id as number | null
    if (!schoolId) {
      setError(t('rubrics.wizard.step1.error.noSchool'))
      return
    }
    setLoadingCourses(true)
    setSelectedCourse(null)
    rubricWizardService
      .getCoursesByFilters({
        school_id: schoolId,
        academic_period_id: Number(selectedPeriod.value),
        is_active: true,
      })
      .then((res) => setCourses(res.data))
      .catch(() => setError(t('rubrics.wizard.step1.error.loadCourses')))
      .finally(() => setLoadingCourses(false))
  }, [selectedPeriod, t])

  const handleNext = async () => {
    if (!selectedPeriod || !selectedCourse) return
    setLoadingSpc(true)
    setError('')
    try {
      const res = await rubricWizardService.getStudyPlanCoursesByFilters({
        course_id: Number(selectedCourse.value),
        academic_period_id: Number(selectedPeriod.value),
        is_active: true,
      })
      const spc = res.data[0]
      if (!spc) {
        setError(t('rubrics.wizard.step1.error.noStudyPlan'))
        return
      }
      const course = courses.find((c) => c.id === Number(selectedCourse.value))!
      const period = periods.find((p) => p.id === Number(selectedPeriod.value))!
      onNext({
        periodId: period.id,
        courseId: course.id,
        studyPlanCourseId: spc.id,
        courseName: course.name,
        periodCode: period.code,
      })
    } catch {
      setError(t('rubrics.wizard.step1.error.studyPlan'))
    } finally {
      setLoadingSpc(false)
    }
  }

  const periodOptions: SelectOption[] = periods.map((p) => ({ label: p.code, value: p.id }))
  const courseOptions: SelectOption[] = courses.map((c) => ({ label: c.name.es, value: c.id }))
  const canContinue = !!selectedPeriod && !!selectedCourse && !loadingSpc

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
                : courses.length === 0
                  ? t('rubrics.wizard.step1.courseNoOptions')
                  : t('rubrics.wizard.step1.coursePlaceholder')
          }
          options={courseOptions}
          value={selectedCourse}
          isDisabled={!selectedPeriod || loadingCourses || courses.length === 0}
          isSearchable
          onChange={(_, v) => setSelectedCourse(v as SelectOption | null)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button variant="primary" disabled={!canContinue} onClick={() => void handleNext()}>
          {loadingSpc ? t('rubrics.wizard.step1.verifying') : t('rubrics.wizard.step1.next')}
        </Button>
      </div>
    </div>
  )
}
