'use client';

import { useCallback, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Button, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { PLANNER_SCRAPE_STATUS_COLORS } from '../constants';
import type { PlannerScrapeRunSummary } from '../types';

interface PlannerScrapeRunHistoryProps {
	data: PlannerScrapeRunSummary[];
	isLoading: boolean;
	isFetching?: boolean;
	errorMessage?: string;
	emptyMessage?: string;
	locale: 'es' | 'en';
	onSelect: (runId: string) => void;
}

export function PlannerScrapeRunHistory({
	data,
	isLoading,
	isFetching,
	errorMessage,
	emptyMessage,
	locale,
	onSelect,
}: PlannerScrapeRunHistoryProps) {
	const { t } = useI18n();
	const dateLocale = locale === 'en' ? 'en-US' : 'es-PE';
	const none = t('planner.history.none');

	const formatDateTime = useCallback(
		(value: string | null) => (value ? new Date(value).toLocaleString(dateLocale) : none),
		[dateLocale, none],
	);

	const columns = useMemo<ColumnDef<PlannerScrapeRunSummary>[]>(
		() => [
			{
				id: 'status',
				header: t('planner.history.col.status'),
				cell: ({ row }) => (
					<Badge color={PLANNER_SCRAPE_STATUS_COLORS[row.original.status]}>
						{t(`planner.run.status.${row.original.status}`)}
					</Badge>
				),
			},
			{ accessorKey: 'period', header: t('planner.history.col.periodo') },
			{
				id: 'school',
				header: t('planner.history.col.school'),
				cell: ({ row }) => row.original.school ?? none,
			},
			{
				id: 'counts',
				header: t('planner.history.col.counts'),
				cell: ({ row }) => {
					const counts = row.original.counts;
					return counts
						? `${counts.sections} / ${counts.evaluations} / ${counts.grades ?? 0}`
						: none;
				},
			},
			{
				id: 'started',
				header: t('planner.history.col.started'),
				cell: ({ row }) => formatDateTime(row.original.startedAt),
			},
			{
				id: 'finished',
				header: t('planner.history.col.finished'),
				cell: ({ row }) => formatDateTime(row.original.finishedAt),
			},
			{
				id: 'triggeredBy',
				header: t('planner.history.col.triggeredBy'),
				cell: ({ row }) => row.original.triggeredByName,
			},
			{
				id: 'actions',
				header: t('planner.history.col.actions'),
				cell: ({ row }) => (
					<Button variant="surface" size="sm" onClick={() => onSelect(row.original.runId)}>
						{t('planner.history.view')}
					</Button>
				),
			},
		],
		[t, none, formatDateTime, onSelect],
	);

	return (
		<DataTable
			columns={columns}
			data={data}
			title={t('planner.history.title')}
			isLoading={isLoading}
			isFetching={isFetching}
			errorMessage={errorMessage}
			emptyMessage={emptyMessage}
			showSearch={false}
			pageSize={10}
			aria-label={t('planner.history.title')}
		/>
	);
}
