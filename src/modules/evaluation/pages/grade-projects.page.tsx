'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'
import { useI18n } from '@/providers'
import { getUserIdFromToken } from '@/shared/lib/jwt'
import { useProfessorByUserId } from '@/modules/academic/hooks'
import { useProjectsByProfessor } from '../hooks'

export function GradeProjectsPage() {
  const { t, locale } = useI18n()
  const [userId, setUserId] = useState<string | number | null>(null)

  useEffect(() => {
    setUserId(getUserIdFromToken())
  }, [])

  const professorEnabled = userId != null

  const {
    data: professor,
    isLoading: isLoadingProfessor,
    isFetching: isFetchingProfessor,
    isError: isErrorProfessor,
  } = useProfessorByUserId(userId ?? undefined)

  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    error: projectsError,
  } = useProjectsByProfessor(professor?.id)

  // "loading" cubre: userId aún null, petición de docente en curso, petición de proyectos en curso
  const isLoading =
    !professorEnabled || isFetchingProfessor || isLoadingProfessor || isLoadingProjects

  // Error de docente sólo después de que la query se habilitó y terminó sin datos
  const professorNotFound =
    professorEnabled && !isLoadingProfessor && !isFetchingProfessor && !professor

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-PE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">{t('projects.grade.title')}</h1>
        <p className="mt-2 text-zinc-600">{t('projects.grade.description')}</p>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
          {!professorEnabled || isFetchingProfessor || isLoadingProfessor
            ? t('projects.grade.loadingProfessor')
            : t('projects.grade.loading')}
        </div>
      ) : isErrorProfessor || professorNotFound ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-sm text-red-700 shadow-sm">
          {t('projects.grade.errorProfessor')}
        </div>
      ) : isErrorProjects ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-sm text-red-700 shadow-sm">
          {projectsError instanceof Error
            ? projectsError.message
            : t('projects.grade.error')}
        </div>
      ) : !projects.length ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
          {t('projects.grade.empty')}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('projects.grade.table.code')}</TableHead>
              <TableHead>{t('projects.grade.table.name')}</TableHead>
              <TableHead>{t('projects.grade.table.course')}</TableHead>
              <TableHead>{t('projects.grade.table.evaluator')}</TableHead>
              <TableHead>{t('projects.grade.table.students')}</TableHead>
              <TableHead>{t('projects.grade.table.evaluationDate')}</TableHead>
              <TableHead className="text-center">{t('projects.grade.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.project_id}>
                {/* Código */}
                <TableCell>
                  <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 font-mono text-xs font-medium text-zinc-700">
                    {project.project_code}
                  </span>
                </TableCell>

                {/* Nombre */}
                <TableCell>
                  <span className="font-medium text-zinc-900">
                    {project.project_name[locale as 'es' | 'en'] ?? project.project_name.es}
                  </span>
                </TableCell>

                {/* Curso */}
                <TableCell>
                  <span className="text-sm text-zinc-700">{project.course_name}</span>
                </TableCell>

                {/* Evaluador */}
                <TableCell>
                  <div className="flex flex-col gap-1 text-sm text-zinc-700">
                    {project.evaluators?.length ? (
                      project.evaluators.map((ev) => (
                        <div key={ev.id} className="flex flex-col gap-0.5">
                          <span className="font-medium">{ev.first_name} {ev.last_name}</span>
                          <span className="inline-flex w-fit items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs text-zinc-500">
                            {ev.evaluator_type[locale as 'es' | 'en'] ?? ev.evaluator_type.es}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </div>
                </TableCell>

                {/* Estudiantes */}
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-sm text-zinc-700">
                    {project.students.length ? (
                      project.students.map((st) => (
                        <div key={st.id} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                          <span>{st.first_name} {st.last_name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </div>
                </TableCell>

                {/* Fecha de evaluación */}
                <TableCell>
                  <span className="text-sm text-zinc-600">
                    {formatDate(project.evaluation_date)}
                  </span>
                </TableCell>

                {/* Acciones */}
                <TableCell className="text-center">
                  <Link
                    href={`/grade-projects/${project.project_id}/evaluate`}
                    title={t('projects.grade.table.grade')}
                    className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded-lg',
                      'text-zinc-500 transition-colors',
                      'hover:bg-blue-50 hover:text-blue-600'
                    )}
                  >
                    <ClipboardDocumentCheckIcon className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
