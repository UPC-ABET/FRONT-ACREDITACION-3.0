'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import type { PerformanceCourseOutcomeSummaryDto, PerformanceLevelLegendDto } from '../../types';

interface PerformanceReportTableProps {
	readonly rows: PerformanceCourseOutcomeSummaryDto[];
	readonly legend: PerformanceLevelLegendDto[];
	readonly isLoading: boolean;
	readonly errorMessage?: string;
	readonly emptyMessage: string;
}

export function PerformanceReportTable({
	rows,
	legend,
	isLoading,
	errorMessage,
	emptyMessage,
}: PerformanceReportTableProps) {
	const { t } = useI18n();

	// legend arrives ordered lowest -> middle -> highest, matching studentsRed/Yellow/Green.
	// Column headers are taken from legend[i].name so the UI never speaks of colors.
	const [lowestLevel, middleLevel, highestLevel] = legend;

	const columns = useMemo<ColumnDef<PerformanceCourseOutcomeSummaryDto>[]>(
		() => [
			{ accessorKey: 'sede', header: t('performanceReports.table.campus') },
			{ accessorKey: 'cicloAcademico', header: t('performanceReports.table.cycle') },
			{
				accessorKey: 'courseCode',
				header: t('performanceReports.table.courseCode'),
				cell: ({ row }) => <span className="font-mono">{row.original.courseCode}</span>,
			},
			{ accessorKey: 'courseName', header: t('performanceReports.table.courseName') },
			{
				accessorKey: 'outcomeCode',
				header: t('performanceReports.table.outcomeCode'),
				cell: ({ row }) => <span className="font-mono">{row.original.outcomeCode}</span>,
			},
			{ accessorKey: 'outcomeName', header: t('performanceReports.table.outcomeName') },
			{
				accessorKey: 'totalStudents',
				header: t('performanceReports.table.totalStudents'),
				meta: { cellClassName: 'text-right tabular-nums', headerClassName: 'text-right' },
			},
			{
				id: 'levelLowest',
				header: lowestLevel?.name || t('performanceReports.table.levelLowest'),
				cell: ({ row }) => (
					<>
						{row.original.studentsRed}{' '}
						<span className="text-zinc-400">({(row.original.percentageRed ?? 0).toFixed(2)}%)</span>
					</>
				),
				meta: { cellClassName: 'text-right tabular-nums', headerClassName: 'text-right' },
			},
			{
				id: 'levelMiddle',
				header: middleLevel?.name || t('performanceReports.table.levelMiddle'),
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
				id: 'levelHighest',
				header: highestLevel?.name || t('performanceReports.table.levelHighest'),
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
				header: t('performanceReports.table.critical'),
				cell: ({ row }) => (
					<span className={row.original.isCritical ? 'font-bold text-red-600' : undefined}>
						{row.original.isCritical
							? t('performanceReports.table.yes')
							: t('performanceReports.table.no')}
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
		[t, lowestLevel, middleLevel, highestLevel],
	);

	return (
		<DataTable
			columns={columns}
			data={rows}
			isLoading={isLoading}
			errorMessage={errorMessage}
			emptyMessage={emptyMessage}
			searchPlaceholder={t('performanceReports.table.searchPlaceholder')}
			aria-label={t('performanceReports.table.ariaLabel')}
		/>
	);
}
