'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
    Badge,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/utils'
import { useI18n } from '@/providers'
import { useRubrics } from '../hooks'
import { mapRubricToRow } from '../utils/rubrics-mappers.utils'

export function RubricsListPage() {
    const { locale } = useI18n()
    const { data, isLoading, isError, error } = useRubrics()
    const { t } = useI18n()
    const items = useMemo(() => (data ?? []).map(mapRubricToRow), [data])

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900">{t('rubrics.list.title')}</h1>
                    <p className="mt-2 text-zinc-600">
                       {t('rubrics.list.description')}
                    </p>
                </div>
                <Link href="/rubrics/new" className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'shrink-0')}>
                    {t('rubrics.list.createButton')}
                </Link>
            </div>

            {isLoading ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
                    {t('rubrics.list.loading')}
                </div>
            ) : isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-sm text-red-700 shadow-sm">
                    {error instanceof Error ? error.message : t('rubrics.list.error')}
                </div>
            ) : !items.length ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
                    {t('rubrics.list.empty')}
                </div>
            ) : (
                <div className="space-y-3">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Curso</TableHead>
                                <TableHead>Periodo Académico</TableHead>
                                <TableHead>Tipo de Evaluación</TableHead>
                                <TableHead>Tipo de rúbrica</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-zinc-900">{row.courseLabel[locale]}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-zinc-700">{row.periodLabel}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-zinc-700">{row.gradeTypeLabel[locale]}</span>
                                    </TableCell>
                                    <TableCell>
                                        {row.isCapstone ? (
                                            <Badge variant="success">Capstone</Badge>
                                        ) : (
                                            <Badge variant="outline">No Capstone</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {row.canEdit ? (
                                            <Link
                                                href={`/rubrics/${row.id}/edit`}
                                                className={cn(buttonVariants({ variant: 'surface', size: 'sm' }), 'inline-flex')}
                                            >
                                                Editar
                                            </Link>
                                        ) : (
                                            <span
                                                className={cn(
                                                    buttonVariants({ variant: 'surface', size: 'sm' }),
                                                    'inline-flex cursor-not-allowed opacity-50'
                                                )}
                                            >
                                                Editar
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
