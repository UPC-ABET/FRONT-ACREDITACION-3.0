'use client'

import { useState, useEffect, useMemo } from 'react'
import { CheckIcon } from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/shared/components/ui/Dialog'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { useI18n } from '@/providers'
import { coursesService } from '@/modules/academic/services'
import type { EnrolledStudentResponse } from '@/modules/academic'

interface WizardSelectStudentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: number
  academicPeriodId: number | null
  studyPlanAcademicPeriodId: number
  selectedIds: Set<number>
  onConfirm: (selected: EnrolledStudentResponse[]) => void
}

export function WizardSelectStudentsModal({
  open,
  onOpenChange,
  courseId,
  academicPeriodId,
  studyPlanAcademicPeriodId,
  selectedIds,
  onConfirm,
}: WizardSelectStudentsModalProps) {
  const { t } = useI18n()

  const [students, setStudents] = useState<EnrolledStudentResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [draft, setDraft] = useState<Map<number, EnrolledStudentResponse>>(new Map())
  const [search, setSearch] = useState('')

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch('')
      setDraft(new Map())
      setStudents([])
    }
  }, [open])

  // Fetch once on open — same call as AddStudentModal
  useEffect(() => {
    if (!open) return

    setIsLoading(true)
    coursesService
      .getEnrolledStudents(courseId, {
        is_active: true,
        ...(academicPeriodId != null ? { academic_period_id: academicPeriodId } : {}),
        study_plan_academic_period_id: studyPlanAcademicPeriodId,
      })
      .then((r) => {
        const data = r.data ?? []
        setStudents(data)
        // Pre-check already selected
        setDraft(new Map(
          data
            .filter((s) => selectedIds.has(s.student_section_enrollment_id))
            .map((s) => [s.student_section_enrollment_id, s]),
        ))
      })
      .catch(() => setStudents([]))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Client-side filter — same as AddStudentModal
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return students
    return students.filter(
      (s) =>
        s.first_name.toLowerCase().includes(term) ||
        s.last_name.toLowerCase().includes(term) ||
        s.student_code.toLowerCase().includes(term) ||
        (s.email ?? '').toLowerCase().includes(term),
    )
  }, [students, search])

  const toggleStudent = (student: EnrolledStudentResponse) => {
    const key = student.student_section_enrollment_id
    setDraft((prev) => {
      const next = new Map(prev)
      if (next.has(key)) next.delete(key)
      else next.set(key, student)
      return next
    })
  }

  const handleConfirm = () => {
    onConfirm(Array.from(draft.values()))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('projects.create.step2.studentsModal.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder={t('projects.create.step2.studentsModal.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {draft.size > 0 && (
            <p className="text-xs text-zinc-500">
              <span className="font-semibold text-zinc-900">{draft.size}</span>{' '}
              {t('projects.create.step2.studentsModal.selected')}
            </p>
          )}

          <div className="h-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-400 animate-pulse">
                {t('projects.create.step2.studentsLoading')}
              </p>
            ) : students.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">
                {t('projects.create.step2.studentsEmpty')}
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">
                {t('projects.create.step2.studentsNoResults')}
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {filtered.map((student) => {
                  const isSelected = draft.has(student.student_section_enrollment_id)
                  return (
                    <li key={student.student_section_enrollment_id}>
                      <button
                        type="button"
                        onClick={() => toggleStudent(student)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${
                          isSelected ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-800'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-medium truncate">
                            {student.first_name} {student.last_name}
                          </span>
                          <div className={`flex items-center gap-2 text-xs ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                            <span className="font-mono">{student.student_code}</span>
                            {student.section_code && (
                              <>
                                <span>·</span>
                                <span>{t('projects.edit.students.modal.section')} {student.section_code}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {isSelected && <CheckIcon className="h-4 w-4 shrink-0" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="secondary">{t('dialog.close')}</Button>} />
          <Button variant="primary" onClick={handleConfirm}>
            {t('projects.create.step2.studentsModal.confirmButton')}
            {draft.size > 0 ? ` (${draft.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
