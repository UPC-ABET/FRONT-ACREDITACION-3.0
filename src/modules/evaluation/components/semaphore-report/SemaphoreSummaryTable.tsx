'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import type { SemaphoreCourseOutcomeSummaryDto, SemaphoreLevelLegendDto } from '../../types';

interface SemaphoreSummaryTableProps {
	readonly rows: SemaphoreCourseOutcomeSummaryDto[];
	readonly legend: SemaphoreLevelLegendDto[];
	readonly isLoading: boolean;
	readonly errorMessage?: string;
	readonly emptyMessage: string;
}

export function SemaphoreSummaryTable({
	rows,
	legend,
	isLoading,
	errorMessage,
	emptyMessage,
}: SemaphoreSummaryTableProps) {
	const { t } = useI18n();

	// legend always arrives ordered rojo -> amarillo -> verde, matching studentsRed/Yellow/Green.
	const [redLevel, yellowLevel, greenLevel] = legend;

	const columns = useMemo<ColumnDef<SemaphoreCourseOutcomeSummaryDto>[]>(
		() => [
			{ accessorKey: 'sede', header: t('semaphoreReports.table.campus') },
			{ accessorKey: 'cicloAcademico', header: t('semaphoreReports.table.cycle') },
			{
				accessorKey: 'courseCode',
				header: t('semaphoreReports.table.courseCode'),
				cell: ({ row }) => <span className="font-mono">{row.original.courseCode}</span>,
			},
			{ accessorKey: 'courseName', header: t('semaphoreReports.table.courseName') },
			{
				accessorKey: 'outcomeCode',
				header: t('semaphoreReports.table.outcomeCode'),
				cell: ({ row }) => <span className="font-mono">{row.original.outcomeCode}</span>,
			},
			{ accessorKey: 'outcomeName', header: t('semaphoreReports.table.outcomeName') },
			{
				accessorKey: 'totalStudents',
				header: t('semaphoreReports.table.totalStudents'),
				meta: { cellClassName: 'text-right tabular-nums', headerClassName: 'text-right' },
			},
			{
				id: 'red',
				header: redLevel?.name ?? '',
				cell: ({ row }) => (
					<>
						{row.original.studentsRed}{' '}
						<span className="text-zinc-400">({(row.original.percentageRed ?? 0).toFixed(2)}%)</span>
					</>
				),
				meta: { cellClassName: 'text-right tabular-nums', headerClassName: 'text-right' },
			},
			{
				id: 'yellow',
				header: yellowLevel?.name ?? '',
				cell: ({ row }) => (
					<>
						{row.original.studentsYellow}{' '}
						<span className="text-zinc-400">
							({(row.original.percentageYellow ?? 0).toFixed(2)}%)
						</span>
					</>
				),
				meta: { cellClassName: 'text-right tabular-nums', headerClassName: 'text-right' },
			},
			{
				id: 'green',
				header: greenLevel?.name ?? '',
				cell: ({ row }) => (
					<>
						{row.original.studentsGreen}{' '}
						<span className="text-zinc-400">
							({(row.original.percentageGreen ?? 0).toFixed(2)}%)
						</span>
					</>
				),
				meta: { cellClassName: 'text-right tabular-nums', headerClassName: 'text-right' },
			},
			{
				accessorKey: 'isCritical',
				header: t('semaphoreReports.table.critical'),
				cell: ({ row }) => (
					<span className={row.original.isCritical ? 'font-bold text-red-600' : undefined}>
						{row.original.isCritical
							? t('semaphoreReports.table.yes')
							: t('semaphoreReports.table.no')}
					</span>
				),
				enableGlobalFilter: false,
			},
			{
				id: 'colorDot',
				header: '',
				cell: ({ row }) => (
					<span
						className="inline-block h-3 w-3 rounded-full"
						style={{ backgroundColor: row.original.color }}
						aria-hidden="true"
					/>
				),
				enableGlobalFilter: false,
			},
		],
		[t, redLevel, yellowLevel, greenLevel],
	);

	return (
		<DataTable
			columns={columns}
			data={rows}
			isLoading={isLoading}
			errorMessage={errorMessage}
			emptyMessage={emptyMessage}
			searchPlaceholder={t('semaphoreReports.table.searchPlaceholder')}
			aria-label={t('semaphoreReports.table.ariaLabel')}
		/>
	);
}
