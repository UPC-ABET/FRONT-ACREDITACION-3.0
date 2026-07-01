'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Undo2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Button, DataTable } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { DEFAULT_PAGE_SIZE, TYPE_CODES } from '@/shared/constants';
import { useUploadHistory } from '../hooks';
import type { UploadLog, UploadLogFilters } from '../types';

interface UploadHistoryTableProps {
	filters?: UploadLogFilters;
	onRollback?: (log: UploadLog) => void;
	onViewErrors?: (log: UploadLog) => void;
}

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

const STATUS_VARIANT: Record<string, 'success' | 'default'> = {
	[TYPE_CODES.UPLOAD_STATUS.COMPLETED]: 'success',
	[TYPE_CODES.UPLOAD_STATUS.ROLLED_BACK]: 'default',
};

function formatDate(iso: string | null | undefined, locale: 'es' | 'en'): string {
	if (!iso) return '—';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return new Intl.DateTimeFormat(locale === 'es' ? 'es-PE' : 'en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}

export default function UploadHistoryTable({
	filters,
	onRollback,
	onViewErrors,
}: UploadHistoryTableProps) {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const [page, setPage] = useState(1);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging to the first page when the external academic period changes
		setPage(1);
	}, [academicPeriodId]);

	const { data, isLoading, isFetching, error } = useUploadHistory(
		{ ...(filters ?? {}), page, pageSize: PAGE_SIZE },
		academicPeriodId,
	);
	const noPeriodSelected = academicPeriodId == null;

	const rows = noPeriodSelected ? [] : (data?.items ?? []);
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 1;

	const columns = useMemo<ColumnDef<UploadLog>[]>(
		() => [
			{
				id: 'id',
				header: t('uploadHistory.table.col.id'),
				cell: ({ row }) => `#${row.original.id}`,
				meta: { cellClassName: 'font-mono text-xs text-zinc-500' },
			},
			{
				id: 'type',
				header: t('uploadHistory.table.col.type'),
				cell: ({ row }) => row.original.uploadType.name[locale] ?? row.original.uploadType.code,
				meta: { cellClassName: 'font-medium text-zinc-900' },
			},
			{
				id: 'status',
				header: t('uploadHistory.table.col.status'),
				cell: ({ row }) => {
					const statusLabel = row.original.status.name[locale] ?? row.original.status.code;
					return (
						<Badge variant={STATUS_VARIANT[row.original.status.code] ?? 'default'}>
							{statusLabel}
						</Badge>
					);
				},
			},
			{
				id: 'file',
				header: t('uploadHistory.table.col.file'),
				cell: ({ row }) => (
					<span
						className="block max-w-[240px] truncate"
						title={row.original.sourceFile ?? undefined}>
						{row.original.sourceFile ?? '—'}
					</span>
				),
				meta: { headerClassName: 'hidden lg:table-cell', cellClassName: 'hidden lg:table-cell' },
			},
			{
				id: 'rows',
				header: t('uploadHistory.table.col.rows'),
				cell: ({ row }) => {
					const log = row.original;
					const hasErrors = (log.errorRows ?? 0) > 0;
					return (
						<>
							<span className="text-zinc-900">{log.loadedRows ?? 0}</span>
							<span className="text-zinc-400"> / {log.totalRows ?? 0}</span>
							{hasErrors && (
								<Badge variant="danger" className="ml-2 tabular-nums">
									{log.errorRows}
								</Badge>
							)}
						</>
					);
				},
				meta: { headerClassName: 'text-right', cellClassName: 'text-right tabular-nums' },
			},
			{
				id: 'user',
				header: t('uploadHistory.table.col.user'),
				cell: ({ row }) =>
					row.original.user ? (
						<div className="flex flex-col leading-tight">
							<span>{row.original.user.fullName}</span>
							<span className="text-xs text-zinc-400">{row.original.user.email}</span>
						</div>
					) : (
						'—'
					),
				meta: { headerClassName: 'hidden md:table-cell', cellClassName: 'hidden md:table-cell' },
			},
			{
				id: 'date',
				header: t('uploadHistory.table.col.date'),
				cell: ({ row }) => formatDate(row.original.createdAt, locale),
			},
			{
				id: 'actions',
				header: () => <span className="sr-only">{t('uploadHistory.table.col.actions')}</span>,
				cell: ({ row }) => {
					const log = row.original;
					const isCompleted = log.status.code === TYPE_CODES.UPLOAD_STATUS.COMPLETED;
					const hasErrors = (log.errorRows ?? 0) > 0;
					return (
						<div className="inline-flex gap-2">
							{hasErrors && (
								<Button
									variant="secondary"
									size="sm"
									onClick={() => onViewErrors?.(log)}
									aria-label={t('uploadHistory.table.viewErrors')}>
									<Eye className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">{t('uploadHistory.table.viewErrors')}</span>
								</Button>
							)}
							{isCompleted && (
								<Button
									variant="secondary"
									size="sm"
									onClick={() => onRollback?.(log)}
									aria-label={t('uploadHistory.table.rollback')}>
									<Undo2 className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">{t('uploadHistory.table.rollback')}</span>
								</Button>
							)}
						</div>
					);
				},
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
			},
		],
		[t, locale, onRollback, onViewErrors],
	);

	return (
		<DataTable<UploadLog, unknown>
			columns={columns}
			data={rows}
			showSearch={false}
			isLoading={!noPeriodSelected && isLoading}
			errorMessage={!noPeriodSelected ? error?.message : undefined}
			emptyMessage={
				noPeriodSelected ? t('uploadHistory.table.selectPeriod') : t('uploadHistory.table.empty')
			}
			serverPagination={{
				page,
				pageCount: totalPages,
				total,
				onPageChange: setPage,
				isFetching,
			}}
			aria-label={t('uploadHistory.table.title')}
		/>
	);
}
