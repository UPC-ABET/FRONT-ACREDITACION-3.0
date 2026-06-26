'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { SemaphoreColorBadge } from './SemaphoreColorBadge';
import type { SemaphoreReportSummaryDto } from '../../types';

interface SemaphoreSummaryTableProps {
	readonly rows: SemaphoreReportSummaryDto[];
	readonly isLoading: boolean;
	readonly errorMessage?: string;
	readonly emptyMessage: string;
}

export function SemaphoreSummaryTable({
	rows,
	isLoading,
	errorMessage,
	emptyMessage,
}: SemaphoreSummaryTableProps) {
	const { t } = useI18n();

	const columns = useMemo<ColumnDef<SemaphoreReportSummaryDto>[]>(
		() => [
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
			{ accessorKey: 'sede', header: t('semaphoreReports.table.campus') },
			{
				accessorKey: 'totalStudents',
				header: t('semaphoreReports.table.totalStudents'),
				meta: { cellClassName: 'text-right tabular-nums', headerClassName: 'text-right' },
			},
			{
				accessorKey: 'studentsAchieved',
				header: t('semaphoreReports.table.studentsAchieved'),
				meta: { cellClassName: 'text-right tabular-nums', headerClassName: 'text-right' },
			},
			{
				accessorKey: 'percentageAchieved',
				header: t('semaphoreReports.table.percentageAchieved'),
				cell: ({ row }) => `${row.original.percentageAchieved.toFixed(2)}%`,
				meta: { cellClassName: 'text-right tabular-nums', headerClassName: 'text-right' },
			},
			{
				accessorKey: 'color',
				header: t('semaphoreReports.table.status'),
				cell: ({ row }) => <SemaphoreColorBadge color={row.original.color} />,
				enableGlobalFilter: false,
			},
		],
		[t],
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
