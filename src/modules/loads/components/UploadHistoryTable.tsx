'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Undo2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button, DataTable } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { TYPE_CODES } from '@/shared/constants';
import { useUploadHistory } from '../hooks';
import type { UploadLog, UploadLogFilters } from '../types';

interface UploadHistoryTableProps {
	filters?: UploadLogFilters;
	onRollback?: (log: UploadLog) => void;
	onViewErrors?: (log: UploadLog) => void;
}

const PAGE_SIZE = 20;

const STATUS_STYLE: Record<string, { dot: string; pill: string }> = {
	[TYPE_CODES.UPLOAD_STATUS.COMPLETED]: {
		dot: 'bg-emerald-500',
		pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
	},
	[TYPE_CODES.UPLOAD_STATUS.ROLLED_BACK]: {
		dot: 'bg-gray-400',
		pill: 'bg-gray-50 text-gray-600 ring-gray-500/20',
	},
};

const FALLBACK_STATUS_STYLE = {
	dot: 'bg-gray-300',
	pill: 'bg-gray-50 text-gray-600 ring-gray-500/20',
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
					const palette = STATUS_STYLE[row.original.status.code] ?? FALLBACK_STATUS_STYLE;
					const statusLabel = row.original.status.name[locale] ?? row.original.status.code;
					return (
						<span
							className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${palette.pill}`}>
							<span aria-hidden className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
							{statusLabel}
						</span>
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
								<span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 tabular-nums">
									{log.errorRows}
								</span>
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
			title={t('uploadHistory.table.title')}
			description={t('uploadHistory.table.description')}
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
