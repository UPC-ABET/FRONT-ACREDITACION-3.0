'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PencilSquareIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Button, buttonVariants } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import type { RubricListRow } from '../../types';

interface UseRubricsColumnsArgs {
	setConfirmTarget: (row: RubricListRow | null) => void;
}

export function useRubricsColumns({ setConfirmTarget }: UseRubricsColumnsArgs) {
	const { t, locale } = useI18n();

	return useMemo<ColumnDef<RubricListRow>[]>(
		() => [
			{
				id: 'program',
				header: t('rubrics.list.columns.program'),
				cell: ({ row }) => (
					<span className="text-zinc-700">{row.original.programLabel[locale]}</span>
				),
				meta: { headerClassName: 'w-[20%] !whitespace-normal' },
			},
			{
				id: 'course',
				header: t('rubrics.list.columns.course'),
				cell: ({ row }) => (
					<span className="font-medium text-zinc-900">{row.original.courseLabel[locale]}</span>
				),
				meta: {
					headerClassName: 'w-[20%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'period',
				header: t('rubrics.list.columns.period'),
				cell: ({ row }) => <span className="text-zinc-700">{row.original.periodLabel}</span>,
				meta: { headerClassName: 'w-[15%] !whitespace-normal' },
			},
			{
				id: 'gradeType',
				header: t('rubrics.list.columns.gradeType'),
				cell: ({ row }) => (
					<span className="text-zinc-700">{row.original.gradeTypeLabel[locale]}</span>
				),
				meta: { headerClassName: 'w-[15%] !whitespace-normal' },
			},
			{
				id: 'rubricType',
				header: t('rubrics.list.columns.rubricType'),
				cell: ({ row }) =>
					row.original.isCapstone ? (
						<Badge variant="success">{t('rubrics.badges.capstone')}</Badge>
					) : (
						<Badge variant="outline">{t('rubrics.badges.noCapstone')}</Badge>
					),
				meta: { headerClassName: 'w-[15%] !whitespace-normal' },
			},
			{
				id: 'actions',
				header: t('rubrics.list.columns.actions'),
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Link
							href={`/rubrics/${row.original.id}/edit`}
							aria-label={
								row.original.canEdit
									? t('rubrics.list.actions.edit')
									: t('rubrics.list.actions.view')
							}
							title={
								row.original.canEdit
									? t('rubrics.list.actions.edit')
									: t('rubrics.list.actions.view')
							}
							className={cn(
								buttonVariants({ variant: 'ghost', size: 'icon' }),
								'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700',
							)}>
							{row.original.canEdit ? (
								<PencilSquareIcon className="h-4 w-4" />
							) : (
								<EyeIcon className="h-4 w-4" />
							)}
						</Link>
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-500 hover:bg-red-50 hover:text-red-600"
							disabled={!row.original.canEdit}
							onClick={() => setConfirmTarget(row.original)}
							aria-label={t('rubrics.list.actions.delete')}
							title={t('rubrics.list.actions.delete')}>
							<TrashIcon className="h-4 w-4" />
						</Button>
					</div>
				),
				meta: {
					headerClassName: 'w-[15%] !whitespace-normal !text-right',
					cellClassName: 'text-right',
				},
			},
		],
		[t, locale, setConfirmTarget],
	);
}
