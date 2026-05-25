'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import {
  Button,
  Select,
  Table,
  TableBody,
  TableCell,
  TableEmptyState,
  TableErrorState,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { getSchoolFromCookie } from '@/shared/lib/jwt'
import { rubricWizardService } from '../services/rubricWizardService'
import { studyPlanCoursesService } from '../services/studyPlanCoursesService'
import { AddEvaluationCourseModal } from '../components/evaluation-courses/AddEvaluationCourseModal'
import type { AcademicPeriodResponse, StudyPlanCourseResponse } from '@/modules/academic/api/dtos/response'

type SelectOption = { label: string; value: string | number }

export function EvaluationCoursesPage() {
  const { t, locale } = useI18n()
  const [selectedPeriod, setSelectedPeriod] = useState<SelectOption | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<StudyPlanCourseResponse | null>(null)

  const schoolId = getSchoolFromCookie()?.id as number | undefined
  const queryClient = useQueryClient()

  // Periods
  const { data: periods = [], isLoading: loadingPeriods } = useQuery<AcademicPeriodResponse[]>({
    queryKey: ['academic-periods-active'],
    queryFn: () => rubricWizardService.getAcademicPeriods().then((r) => r.data.filter((p) => p.is_active)),
    staleTime: 1000 * 60 * 5,
  })

  const periodOptions: SelectOption[] = periods.map((p) => ({ label: p.code, value: p.id }))

  // Evaluation courses list
  const {
    data: courses = [],
    isLoading: loadingCourses,
    isError,
    error,
    refetch,
  } = useQuery<StudyPlanCourseResponse[]>({
    queryKey: ['evaluation-courses', selectedPeriod?.value, schoolId],
    queryFn: () =>
      studyPlanCoursesService
        .getByFilters({
          academic_period_id: Number(selectedPeriod!.value),
          school_id: schoolId,
          extra: { is_evaluate_rubric: true },
          is_active: true,
        })
        .then((r) => r.data),
    enabled: !!selectedPeriod && !!schoolId,
    staleTime: 0,
  })

  const removeMutation = useMutation({
    mutationFn: (spc: StudyPlanCourseResponse) => {
      const { is_evaluate_rubric: _, ...rest } = (spc.extra ?? {}) as Record<string, unknown>
      return studyPlanCoursesService.update(spc.id, { extra: rest })
    },
    onSuccess: () => {
      setConfirmTarget(null)
      queryClient.invalidateQueries({ queryKey: ['evaluation-courses'] })
    },
    onError: () => setConfirmTarget(null),
  })

  const courseName = (spc: StudyPlanCourseResponse) =>
    typeof spc.course?.name === 'string'
      ? spc.course.name
      : (spc.course?.name?.[locale] ?? String(spc.course_id))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">{t('evaluationCourses.list.title')}</h1>
          <p className="mt-2 text-zinc-600">{t('evaluationCourses.list.description')}</p>
        </div>
        <Button variant="primary" className="shrink-0" onClick={() => setModalOpen(true)}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          {t('evaluationCourses.list.addButton')}
        </Button>
      </div>

      {/* Period filter */}
      <div className="max-w-xs">
        <Select
          label={t('evaluationCourses.list.periodLabel')}
          placeholder={
            loadingPeriods
              ? t('evaluationCourses.list.periodLoading')
              : t('evaluationCourses.list.periodPlaceholder')
          }
          options={periodOptions}
          value={selectedPeriod}
          isDisabled={loadingPeriods}
          isSearchable
          onChange={(_, v) => setSelectedPeriod(v as SelectOption | null)}
        />
      </div>

      {/* Table */}
      {!selectedPeriod ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-400">
          {t('evaluationCourses.list.selectPeriodFirst')}
        </div>
      ) : loadingCourses ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          {t('evaluationCourses.list.loading')}
        </div>
      ) : isError ? (
        <TableErrorState
          message={error instanceof Error ? error.message : t('evaluationCourses.list.error')}
        />
      ) : courses.length === 0 ? (
        <TableEmptyState message={t('evaluationCourses.list.empty')} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('evaluationCourses.list.columns.course')}</TableHead>
              <TableHead>{t('evaluationCourses.list.columns.period')}</TableHead>
              <TableHead className="w-20 text-center">{t('evaluationCourses.list.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((spc) => (
              <TableRow key={spc.id}>
                <TableCell>
                  <span className="font-medium text-zinc-900">{courseName(spc)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-600">{selectedPeriod.label}</span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(spc)}
                      title={t('evaluationCourses.list.removeButton')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add modal */}
      <AddEvaluationCourseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => refetch()}
      />

      {/* Confirm remove modal */}
      <Dialog open={!!confirmTarget} onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('evaluationCourses.confirm.title')}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-zinc-600">
            {t('evaluationCourses.confirm.body').replace(
              '{{course}}',
              confirmTarget ? courseName(confirmTarget) : '',
            )}
          </p>

          <DialogFooter>
            <DialogClose
              render={
                <Button variant="secondary" disabled={removeMutation.isPending}>
                  {t('dialog.close')}
                </Button>
              }
            />
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              disabled={removeMutation.isPending}
              onClick={() => confirmTarget && removeMutation.mutate(confirmTarget)}
            >
              {removeMutation.isPending
                ? t('evaluationCourses.confirm.removing')
                : t('evaluationCourses.confirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
