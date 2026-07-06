'use client';

import { useMemo } from 'react';
import type { CellContext, ColumnDef, Table } from '@tanstack/react-table';
import { DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import type { PerformanceCourseOutcomeSummaryDto, PerformanceLevelLegendDto } from '../../types';

type SummaryRow = PerformanceCourseOutcomeSummaryDto;

interface PerformanceReportTableProps {
	readonly rows: SummaryRow[];
	readonly legend: PerformanceLevelLegendDto[];
	readonly isLoading: boolean;
	readonly errorMessage?: string;
	readonly emptyMessage: string;
}

// Rows for the same outcome are grouped: the outcome code/name is printed once for the first
// row of the group and blanked on the following ones. Grouping is evaluated over the current
// page's row model, so a group that starts at the top of a page still shows its outcome.
//
// Cached per page-rows array (identity), so the O(n) scan runs once per page render instead of
// once per cell — mirrors the columns/sortedRows memoization already used in this file.
const firstOfGroupCache = new WeakMap<object, Set<string>>();

function firstOfGroupIds(
	pageRows: ReturnType<Table<SummaryRow>['getRowModel']>['rows'],
): Set<string> {
	const cached = firstOfGroupCache.get(pageRows);
	if (cached) return cached;

	const ids = new Set<string>();
	pageRows.forEach((pageRow, index) => {
		if (index === 0 || pageRow.original.outcomeCode !== pageRows[index - 1].original.outcomeCode) {
			ids.add(pageRow.id);
		}
	});
	firstOfGroupCache.set(pageRows, ids);
	return ids;
}

function isFirstOfOutcomeGroup(row: { id: string }, table: Table<SummaryRow>): boolean {
	return firstOfGroupIds(table.getRowModel().rows).has(row.id);
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
			{
				accessorKey: 'outcomeCode',
				header: t('performanceReports.table.outcomeCode'),
				cell: ({ row, table }: CellContext<SummaryRow, unknown>) =>
					isFirstOfOutcomeGroup(row, table) ? (
						<span className="font-mono font-semibold">{row.original.outcomeCode}</span>
					) : null,
			},
			{
				accessorKey: 'outcomeName',
				header: t('performanceReports.table.outcomeName'),
				cell: ({ row, table }: CellContext<SummaryRow, unknown>) =>
					isFirstOfOutcomeGroup(row, table) ? row.original.outcomeName : null,
			},
			{ accessorKey: 'campus', header: t('performanceReports.table.campus') },
			{ accessorKey: 'academicPeriodCycle', header: t('performanceReports.table.cycle') },
			{
				accessorKey: 'courseCode',
				header: t('performanceReports.table.courseCode'),
				cell: ({ row }) => <span className="font-mono">{row.original.courseCode}</span>,
			},
			{ accessorKey: 'courseName', header: t('performanceReports.table.courseName') },
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

	// Sort so rows of the same outcome sit together (grouping blanks the repeated outcome cells).
	// Outcome code first (natural order: SO1, SO2, SO10), then campus and course for a stable read.
	const sortedRows = useMemo<SummaryRow[]>(() => {
		const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
		return [...rows].sort(
			(a, b) =>
				collator.compare(a.outcomeCode, b.outcomeCode) ||
				collator.compare(a.campus, b.campus) ||
				collator.compare(a.courseCode, b.courseCode),
		);
	}, [rows]);

	return (
		<DataTable
			columns={columns}
			data={sortedRows}
			isLoading={isLoading}
			errorMessage={errorMessage}
			emptyMessage={emptyMessage}
			searchPlaceholder={t('performanceReports.table.searchPlaceholder')}
			aria-label={t('performanceReports.table.ariaLabel')}
		/>
	);
}
