'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, PencilIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input, Skeleton, TextArea, Toast } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { useProjectDetails, projectsQueryKeys } from '../hooks'
import { projectsService } from '../services'
import { AddEvaluatorModal, AddStudentModal } from '../components/project-edit'

interface ProjectEditPageProps {
  projectId: string
}

export function ProjectEditPage({ projectId }: ProjectEditPageProps) {
  const { t, locale } = useI18n()
  const queryClient = useQueryClient()

  const [studentError, setStudentError] = useState<string | null>(null)
  const [evaluatorError, setEvaluatorError] = useState<string | null>(null)
  const [evaluatorModalOpen, setEvaluatorModalOpen] = useState(false)
  const [studentModalOpen, setStudentModalOpen] = useState(false)

  // Header edit mode
  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [draftCode, setDraftCode] = useState('')
  const [draftName, setDraftName] = useState('')
  const [draftDesc, setDraftDesc] = useState('')

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const { data, isLoading, isError, error } = useProjectDetails(projectId, {
    isEvaluationMode: false,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: projectsQueryKeys.details(projectId, { isEvaluationMode: false }),
    })

  const enterEditMode = () => {
    if (!data) return
    const loc = locale as 'es' | 'en'
    setDraftCode(data.project.code)
    setDraftName(data.project.name[loc] ?? data.project.name.es)
    setDraftDesc(data.project.description[loc] ?? data.project.description.es)
    setIsEditingHeader(true)
  }

  const updateMutation = useMutation({
    mutationFn: () => {
      const loc = locale as 'es' | 'en'
      const other = loc === 'es' ? 'en' : 'es'
      const body: Parameters<typeof projectsService.update>[1] = {}

      if (draftCode.trim() !== data!.project.code) {
        body.code = draftCode.trim()
      }
      if (draftName.trim() !== (data!.project.name[loc] ?? data!.project.name.es)) {
        body.name = { [loc]: draftName.trim(), [other]: data!.project.name[other] } as { es: string; en: string }
      }
      if (draftDesc.trim() !== (data!.project.description[loc] ?? data!.project.description.es)) {
        body.description = { [loc]: draftDesc.trim(), [other]: data!.project.description[other] } as { es: string; en: string }
      }

      return projectsService.update(data!.project.id, body)
    },
    onSuccess: () => {
      invalidate()
      setIsEditingHeader(false)
      showToast('success', t('projects.edit.header.saveSuccess'))
    },
    onError: () => showToast('error', t('projects.edit.header.saveError')),
  })

  const addStudentMutation = useMutation({
    mutationFn: (enrollmentIds: number[]) =>
      projectsService.addStudents(projectId, enrollmentIds),
    onSuccess: () => {
      invalidate()
      setStudentError(null)
    },
    onError: () => setStudentError(t('projects.edit.students.addError')),
  })

  const removeStudentMutation = useMutation({
    mutationFn: (projectStudentId: number) =>
      projectsService.removeStudent(projectStudentId),
    onSuccess: () => {
      invalidate()
      setStudentError(null)
      showToast('success', t('projects.edit.students.removeSuccess'))
    },
    onError: () => {
      setStudentError(t('projects.edit.students.removeError'))
      showToast('error', t('projects.edit.students.removeError'))
    },
  })

  const addEvaluatorMutation = useMutation({
    mutationFn: (professorIds: number[]) =>
      projectsService.addEvaluators(projectId, professorIds),
    onSuccess: () => {
      invalidate()
      setEvaluatorError(null)
    },
    onError: () => setEvaluatorError(t('projects.edit.evaluators.addError')),
  })

  const removeEvaluatorMutation = useMutation({
    mutationFn: (projectEvaluatorId: number) =>
      projectsService.removeEvaluator(projectEvaluatorId),
    onSuccess: () => {
      invalidate()
      setEvaluatorError(null)
      showToast('success', t('projects.edit.evaluators.removeSuccess'))
    },
    onError: () => {
      setEvaluatorError(t('projects.edit.evaluators.removeError'))
      showToast('error', t('projects.edit.evaluators.removeError'))
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('projects.edit.backButton')}
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
          {isError && error instanceof Error
            ? error.message
            : t('projects.edit.error')}
        </div>
      </div>
    )
  }

  const { project, students, evaluators, rubric } = data

  const projectName = project.name[locale as 'es' | 'en'] ?? project.name.es
  const courseName = rubric.course.name[locale as 'es' | 'en'] ?? rubric.course.name.es

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t('projects.edit.backButton')}
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        {isEditingHeader ? (
          <div className="flex flex-col gap-4">
            {/* Edit mode fields */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">
                  {t('projects.edit.header.fieldCode')}
                </label>
                <Input
                  value={draftCode}
                  onChange={(e) => setDraftCode(e.target.value)}
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">
                  {t('projects.edit.header.fieldName')}
                </label>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">
                  {t('projects.edit.header.fieldDesc')}
                </label>
                <TextArea
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                  disabled={updateMutation.isPending}
                  rows={3}
                />
              </div>
            </div>

            {/* Edit mode actions */}
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4">
              <button
                type="button"
                onClick={() => setIsEditingHeader(false)}
                disabled={updateMutation.isPending}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('projects.edit.header.cancelButton')}
              </button>
              <button
                type="button"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateMutation.isPending
                  ? t('projects.edit.header.saving')
                  : t('projects.edit.header.saveButton')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{projectName}</h1>
                <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-mono text-xs font-medium text-zinc-600">
                  {project.code}
                </span>
              </div>
              <button
                type="button"
                onClick={enterEditMode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                <PencilIcon className="h-4 w-4" />
                {t('projects.edit.header.editButton')}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-600">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-zinc-400">{t('projects.edit.header.course')}</span>
                <span>{courseName}</span>
              </div>
            </div>

            {(() => {
              const desc = project.description[locale as 'es' | 'en'] ?? project.description.es
              return desc ? (
                <div className="flex items-start gap-1.5 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-400 shrink-0">
                    {t('projects.edit.header.fieldDesc')}
                  </span>
                  <span className="text-zinc-500 leading-relaxed">{desc}</span>
                </div>
              ) : null
            })()}
          </div>
        )}
      </div>

      {/* Students section */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-zinc-900">
              {t('projects.edit.students.title')}
            </h2>
            <span className="text-xs text-zinc-400">{students.length}</span>
          </div>
          <button
            type="button"
            onClick={() => setStudentModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <PlusIcon className="h-4 w-4" />
            {t('projects.edit.students.addButton')}
          </button>
        </div>

        <div className="divide-y divide-zinc-100">
          {students.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-zinc-400">
              {t('projects.edit.students.empty')}
            </p>
          ) : (
            students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-zinc-900">
                    {student.first_name} {student.last_name}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                    <span className="font-mono">{student.student_code}</span>
                    <span className="text-zinc-300">·</span>
                    <span>{student.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeStudentMutation.mutate(student.id)}
                  disabled={removeStudentMutation.isPending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Eliminar"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Evaluators section */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-zinc-900">
              {t('projects.edit.evaluators.title')}
            </h2>
            <span className="text-xs text-zinc-400">{evaluators?.length ?? 0}</span>
          </div>
          <button
            type="button"
            onClick={() => setEvaluatorModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <PlusIcon className="h-4 w-4" />
            {t('projects.edit.evaluators.addButton')}
          </button>
        </div>

        <div className="divide-y divide-zinc-100">
          {!evaluators?.length ? (
            <p className="px-6 py-8 text-center text-sm text-zinc-400">
              {t('projects.edit.evaluators.empty')}
            </p>
          ) : (
            evaluators.map((evaluator) => (
              <div
                key={evaluator.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-900">
                      {evaluator.professor_first_name} {evaluator.professor_last_name}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      {evaluator.evaluator_type_name[locale as 'es' | 'en'] ?? evaluator.evaluator_type_name.es}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">{evaluator.professor_email}</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeEvaluatorMutation.mutate(evaluator.id)}
                  disabled={removeEvaluatorMutation.isPending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Eliminar"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>

      <AddStudentModal
        open={studentModalOpen}
        onOpenChange={setStudentModalOpen}
        projectId={projectId}
        projectNumericId={project.id}
        courseId={rubric.course.id}
        academicPeriodId={data.academic_period?.id ?? null}
        onSuccess={() => showToast('success', t('projects.edit.students.modal.successMessage'))}
      />

      <AddEvaluatorModal
        open={evaluatorModalOpen}
        onOpenChange={setEvaluatorModalOpen}
        projectId={projectId}
        projectNumericId={project.id}
        onSuccess={() => showToast('success', t('projects.edit.evaluators.modal.successMessage'))}
      />

      <Toast
        isOpen={!!toast}
        type={toast?.type}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  )
}
