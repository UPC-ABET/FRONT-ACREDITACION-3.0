'use client'

import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Skeleton } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { useProjectDetails } from '../hooks'
import { ProjectRubricNonCapstoneTable } from '../components/project-evaluate/ProjectRubricNonCapstoneTable'
import { ProjectRubricCapstoneTable } from '../components/project-evaluate/ProjectRubricCapstoneTable'

const CAPSTONE_RUBRIC_TYPE_ID = 29

interface ProjectEvaluatePageProps {
  projectId: string
  gradeTypeId: number
}

export function ProjectEvaluatePage({ projectId, gradeTypeId }: ProjectEvaluatePageProps) {
  const { t, locale } = useI18n()

  const { data, isLoading, isError, error } = useProjectDetails(projectId, { gradeTypeId })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/grade-projects"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('projects.evaluate.backButton')}
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
          {isError && error instanceof Error
            ? error.message
            : t('projects.evaluate.error')}
        </div>
      </div>
    )
  }

  const { project, students, rubric } = data

  const projectName = project.name[locale as 'es' | 'en'] ?? project.name.es
  const courseName = rubric.course.name[locale as 'es' | 'en'] ?? rubric.course.name.es
  const rubricTypeName =
    rubric.rubric.rubric_type?.name[locale as 'es' | 'en'] ??
    rubric.rubric.rubric_type?.name.es ??
    '—'
  const gradeTypeName =
    rubric.rubric.grade_type?.name[locale as 'es' | 'en'] ??
    rubric.rubric.grade_type?.name.es ??
    '—'

  const isCapstone = rubric.rubric.rubric_type?.id === CAPSTONE_RUBRIC_TYPE_ID

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/grade-projects"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t('projects.evaluate.backButton')}
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Project title + code */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{projectName}</h1>
              <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-mono text-xs font-medium text-zinc-600">
                {project.code}
              </span>
            </div>
          </div>

          {/* Context metadata */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-600">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-zinc-400">{t('projects.evaluate.header.course')}</span>
              <span>{courseName}</span>
            </div>
            <span className="text-zinc-200">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-zinc-400">{t('projects.evaluate.header.rubric')}</span>
              <span>{rubricTypeName}</span>
            </div>
            <span className="text-zinc-200">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-zinc-400">{t('projects.evaluate.header.gradeType')}</span>
              <span>{gradeTypeName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Students summary */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">
            {t('projects.evaluate.students.title')}
          </h2>
        </div>

        <div className="divide-y divide-zinc-100">
          {students.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-zinc-400">
              {t('projects.evaluate.students.empty')}
            </p>
          ) : (
            students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                {/* Student info */}
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

                {/* Total grade */}
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs font-medium text-zinc-400">
                    {t('projects.evaluate.students.grade')}
                  </span>
                  {student.total_grade != null ? (
                    <span className="text-2xl font-bold tabular-nums text-zinc-900">
                      {student.total_grade}
                      <span className="ml-0.5 text-sm font-normal text-zinc-400">/20</span>
                    </span>
                  ) : (
                    <span className="text-sm text-zinc-400">
                      {t('projects.evaluate.students.noGrade')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rubric table */}
      {isCapstone ? (
        <ProjectRubricCapstoneTable
          outcomes={rubric.outcomes}
          questions={rubric.questions}
          students={students}
          academicPeriodId={data.academic_period?.id ?? null}
        />
      ) : (
        rubric.questions.length > 0 && (
          <ProjectRubricNonCapstoneTable
            questions={rubric.questions}
            students={students}
          />
        )
      )}
    </div>
  )
}
