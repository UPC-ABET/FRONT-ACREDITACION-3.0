'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
	Badge,
	DataTable,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Select,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { useProcessedRvGrades } from '../../hooks/useProcessedRvGrades';
import type { ProcessedRvGradeDto, ProcessedRvGradeFilterDto } from '../../types';

const ORIGIN_FILTERS = {
	ALL: 'all',
	CONVERTED: 'converted',
	GRADED: 'graded',
} as const;

type OriginFilter = (typeof ORIGIN_FILTERS)[keyof typeof ORIGIN_FILTERS];

// levelRank arrives lowest -> highest (1 red, 2 yellow, 3 green). The label always carries the
// level name, so color is never the only signal.
function levelVariant(levelRank: number | null) {
	if (levelRank === 1) return 'danger' as const;
	if (levelRank === 3) return 'success' as const;
	return 'default' as const;
}

interface ProcessedRvGradesDialogProps {
	readonly open: boolean;
	readonly onClose: () => void;
	readonly programCommissionId?: number;
	readonly outcomeId?: number;
	readonly academicPeriodId: number | null;
}

export function ProcessedRvGradesDialog({
	open,
	onClose,
	programCommissionId,
	outcomeId,
	academicPeriodId,
}: ProcessedRvGradesDialogProps) {
	const { t } = useI18n();
	const [originFilter, setOriginFilter] = useState<OriginFilter>(ORIGIN_FILTERS.ALL);

	const filters = useMemo<ProcessedRvGradeFilterDto>(
		() => ({
			programCommissionId,
			outcomeId,
			isConverted:
				originFilter === ORIGIN_FILTERS.ALL ? undefined : originFilter === ORIGIN_FILTERS.CONVERTED,
		}),
		[programCommissionId, outcomeId, originFilter],
	);

	const gradesQuery = useProcessedRvGrades(filters, academicPeriodId, open);
	const grades = gradesQuery.data ?? [];

	const originOptions = useMemo(
		() => [
			{ value: ORIGIN_FILTERS.ALL, label: t('processedRvGrades.filters.allOrigins') },
			{ value: ORIGIN_FILTERS.GRADED, label: t('processedRvGrades.origin.graded') },
			{ value: ORIGIN_FILTERS.CONVERTED, label: t('processedRvGrades.origin.converted') },
		],
		[t],
	);

	const columns = useMemo<ColumnDef<ProcessedRvGradeDto>[]>(
		() => [
			{
				accessorKey: 'studentCode',
				header: t('processedRvGrades.table.studentCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{ accessorKey: 'studentName', header: t('processedRvGrades.table.studentName') },
			{
				accessorKey: 'courseCode',
				header: t('processedRvGrades.table.courseCode'),
				meta: { cellClassName: 'font-mono' },
			},
			{
				accessorKey: 'outcomeCode',
				header: t('processedRvGrades.table.outcomeCode'),
				meta: { cellClassName: 'font-mono' },
			},
			{
				id: 'grade',
				header: t('processedRvGrades.table.grade'),
				accessorFn: (row) => row.grade,
				cell: ({ row }) => row.original.grade.toFixed(2),
				enableGlobalFilter: false,
				meta: { headerClassName: 'text-right', cellClassName: 'text-right tabular-nums' },
			},
			{
				id: 'scaledGrade',
				header: t('processedRvGrades.table.scaledGrade'),
				accessorFn: (row) => row.scaledGrade,
				cell: ({ row }) => (
					<span className="font-semibold text-zinc-800">{row.original.scaledGrade.toFixed(2)}</span>
				),
				enableGlobalFilter: false,
				meta: { headerClassName: 'text-right', cellClassName: 'text-right tabular-nums' },
			},
			{
				id: 'level',
				header: t('processedRvGrades.table.level'),
				accessorFn: (row) => row.levelName,
				cell: ({ row }) => (
					<Badge variant={levelVariant(row.original.levelRank)}>{row.original.levelName}</Badge>
				),
			},
			{
				id: 'origin',
				header: t('processedRvGrades.table.origin'),
				enableGlobalFilter: false,
				cell: ({ row }) =>
					row.original.isConverted ? (
						<Badge variant="outline">{t('processedRvGrades.origin.converted')}</Badge>
					) : (
						<Badge variant="default">{t('processedRvGrades.origin.graded')}</Badge>
					),
			},
			{
				id: 'traceability',
				header: t('processedRvGrades.table.traceability'),
				enableGlobalFilter: false,
				cell: ({ row }) => {
					const { isConverted, formula, sourceCommissionCode } = row.original;
					if (!isConverted || !formula) return <span className="text-zinc-400">—</span>;
					return (
						<div className="flex flex-col gap-1">
							<span className="font-mono text-zinc-800">{formula}</span>
							{sourceCommissionCode && (
								<span className="text-xs text-zinc-500">
									{t('processedRvGrades.table.sourceCommission')}: {sourceCommissionCode}
								</span>
							)}
						</div>
					);
				},
			},
		],
		[t],
	);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) onClose();
			}}>
			<DialogContent className="sm:max-w-6xl">
				<DialogHeader>
					<DialogTitle>{t('processedRvGrades.title')}</DialogTitle>
					<DialogDescription>{t('processedRvGrades.subtitle')}</DialogDescription>
				</DialogHeader>

				<DataTable
					columns={columns}
					data={grades}
					aria-label={t('processedRvGrades.title')}
					searchPlaceholder={t('processedRvGrades.searchPlaceholder')}
					isLoading={gradesQuery.isLoading}
					isFetching={gradesQuery.isFetching}
					errorMessage={
						gradesQuery.isError
							? tryTranslate(t, getErrorMessage(gradesQuery.error, 'processedRvGrades.error'))
							: undefined
					}
					emptyMessage={t('processedRvGrades.empty')}
					filters={
						<div className="w-full sm:w-56">
							<Select
								name="origin"
								aria-label={t('processedRvGrades.filters.origin')}
								options={originOptions}
								value={originOptions.find((option) => option.value === originFilter) ?? null}
								onChange={(_name, value) => {
									if (value && !Array.isArray(value)) setOriginFilter(value.value as OriginFilter);
								}}
							/>
						</div>
					}
				/>

				<DialogFooter showCloseButton />
			</DialogContent>
		</Dialog>
	);
}
