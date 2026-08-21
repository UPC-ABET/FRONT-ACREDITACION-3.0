'use client';

import { useCallback, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Button, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { SCRAPE_STATUS_COLORS } from '../constants';
import { ScrapePhaseLabel } from './ScrapePhaseLabel';
import type { ScrapeRunSummary } from '../types';

interface ScrapeRunHistoryProps {
	data: ScrapeRunSummary[];
	isLoading: boolean;
	isFetching?: boolean;
	errorMessage?: string;
	emptyMessage?: string;
	locale: 'es' | 'en';
	onSelect: (runId: string) => void;
}

export function ScrapeRunHistory({
	data,
	isLoading,
	isFetching,
	errorMessage,
	emptyMessage,
	locale,
	onSelect,
}: ScrapeRunHistoryProps) {
	const { t } = useI18n();
	const dateLocale = locale === 'en' ? 'en-US' : 'es-PE';
	const none = t('banner.history.none');

	const formatDateTime = useCallback(
		(value: string | null) => (value ? new Date(value).toLocaleString(dateLocale) : none),
		[dateLocale, none],
	);

	const columns = useMemo<ColumnDef<ScrapeRunSummary>[]>(
		() => [
			{
				id: 'status',
				header: t('banner.history.col.status'),
				cell: ({ row }) => (
					<div className="space-y-1">
						<Badge color={SCRAPE_STATUS_COLORS[row.original.status]}>
							{t(`banner.run.status.${row.original.status}`)}
						</Badge>
						<ScrapePhaseLabel phase={row.original.phase} />
					</div>
				),
			},
			{ accessorKey: 'nivel', header: t('banner.history.col.nivel') },
			{
				id: 'departments',
				header: t('banner.history.col.departments'),
				cell: ({ row }) => row.original.departamentos.join(', ') || none,
			},
			{
				id: 'counts',
				header: t('banner.history.col.counts'),
				cell: ({ row }) => {
					const counts = row.original.counts;
					return counts ? `${counts.horario} / ${counts.matricula} / ${counts.alumno}` : none;
				},
			},
			{
				id: 'started',
				header: t('banner.history.col.started'),
				cell: ({ row }) => formatDateTime(row.original.startedAt),
			},
			{
				id: 'finished',
				header: t('banner.history.col.finished'),
				cell: ({ row }) => formatDateTime(row.original.finishedAt),
			},
			{
				id: 'triggeredBy',
				header: t('banner.history.col.triggeredBy'),
				cell: ({ row }) => row.original.triggeredBy ?? none,
			},
			{
				id: 'actions',
				header: t('banner.history.col.actions'),
				cell: ({ row }) => (
					<Button variant="surface" size="sm" onClick={() => onSelect(row.original.runId)}>
						{t('banner.history.view')}
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
			title={t('banner.history.title')}
			isLoading={isLoading}
			isFetching={isFetching}
			errorMessage={errorMessage}
			emptyMessage={emptyMessage}
			showSearch={false}
			pageSize={10}
			aria-label={t('banner.history.title')}
		/>
	);
}
