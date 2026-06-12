'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Undo2 } from 'lucide-react';
import { Card, Button } from '@/shared/components';
import { useI18n } from '@/providers';
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
	const [page, setPage] = useState(1);
	const { data, isLoading, isFetching, error } = useUploadHistory({
		...(filters ?? {}),
		page,
		pageSize: PAGE_SIZE,
	});
	const rows = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 1;

	return (
		<Card title={t('uploadHistory.table.title')} description={t('uploadHistory.table.description')}>
			{isLoading && (
				<p className="py-8 text-center text-sm text-gray-500">{t('uploadHistory.table.loading')}</p>
			)}
			{error && <p className="py-4 text-sm text-red-600">{error.message}</p>}
			{!isLoading && !error && rows.length === 0 && (
				<p className="py-12 text-center text-sm text-gray-400">{t('uploadHistory.table.empty')}</p>
			)}

			{rows.length > 0 && (
				<div
					className={`-mx-4 overflow-x-auto sm:-mx-6 ${
						isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'
					}`}>
					<div className="inline-block min-w-full align-middle">
						<table className="min-w-full divide-y divide-gray-200 text-sm">
							<thead className="bg-gray-50/60">
								<tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
									<th scope="col" className="px-4 py-3 sm:px-6">
										{t('uploadHistory.table.col.id')}
									</th>
									<th scope="col" className="px-4 py-3">
										{t('uploadHistory.table.col.type')}
									</th>
									<th scope="col" className="px-4 py-3">
										{t('uploadHistory.table.col.status')}
									</th>
									<th scope="col" className="hidden px-4 py-3 lg:table-cell">
										{t('uploadHistory.table.col.file')}
									</th>
									<th scope="col" className="px-4 py-3 text-right">
										{t('uploadHistory.table.col.rows')}
									</th>
									<th scope="col" className="hidden px-4 py-3 md:table-cell">
										{t('uploadHistory.table.col.user')}
									</th>
									<th scope="col" className="px-4 py-3 whitespace-nowrap">
										{t('uploadHistory.table.col.date')}
									</th>
									<th scope="col" className="px-4 py-3 text-right sm:px-6">
										<span className="sr-only">{t('uploadHistory.table.col.actions')}</span>
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 bg-white">
								{rows.map((log) => {
									const palette = STATUS_STYLE[log.status.code] ?? FALLBACK_STATUS_STYLE;
									const isCompleted = log.status.code === TYPE_CODES.UPLOAD_STATUS.COMPLETED;
									const typeLabel = log.uploadType.name[locale] ?? log.uploadType.code;
									const statusLabel = log.status.name[locale] ?? log.status.code;
									const hasErrors = (log.errorRows ?? 0) > 0;
									return (
										<tr key={log.id} className="transition-colors hover:bg-gray-50/60">
											<td className="px-4 py-4 font-mono text-xs whitespace-nowrap text-gray-500 sm:px-6">
												#{log.id}
											</td>
											<td className="px-4 py-4 font-medium text-gray-900">{typeLabel}</td>
											<td className="px-4 py-4">
												<span
													className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${palette.pill}`}>
													<span aria-hidden className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
													{statusLabel}
												</span>
											</td>
											<td
												className="hidden max-w-[240px] truncate px-4 py-4 text-gray-600 lg:table-cell"
												title={log.sourceFile ?? undefined}>
												{log.sourceFile ?? '—'}
											</td>
											<td className="px-4 py-4 text-right whitespace-nowrap tabular-nums">
												<span className="text-gray-900">{log.loadedRows ?? 0}</span>
												<span className="text-gray-400"> / {log.totalRows ?? 0}</span>
												{hasErrors && (
													<span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 tabular-nums">
														{log.errorRows}
													</span>
												)}
											</td>
											<td className="hidden px-4 py-4 text-gray-700 md:table-cell">
												{log.user ? (
													<div className="flex flex-col leading-tight">
														<span>{log.user.fullName}</span>
														<span className="text-xs text-gray-400">{log.user.email}</span>
													</div>
												) : (
													'—'
												)}
											</td>
											<td className="px-4 py-4 whitespace-nowrap text-gray-600">
												{formatDate(log.createdAt, locale)}
											</td>
											<td className="px-4 py-4 whitespace-nowrap text-right sm:px-6">
												<div className="inline-flex gap-2">
													{hasErrors && (
														<Button
															variant="secondary"
															size="sm"
															onClick={() => onViewErrors?.(log)}
															aria-label={t('uploadHistory.table.viewErrors')}>
															<Eye className="h-3.5 w-3.5" />
															<span className="hidden sm:inline">
																{t('uploadHistory.table.viewErrors')}
															</span>
														</Button>
													)}
													{isCompleted && (
														<Button
															variant="secondary"
															size="sm"
															onClick={() => onRollback?.(log)}
															aria-label={t('uploadHistory.table.rollback')}>
															<Undo2 className="h-3.5 w-3.5" />
															<span className="hidden sm:inline">
																{t('uploadHistory.table.rollback')}
															</span>
														</Button>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{!isLoading && !error && rows.length > 0 && (
				<div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-xs text-gray-500">
						{total} {t('uploadHistory.table.results')}
					</p>
					<div className="flex items-center justify-center gap-3">
						<Button
							variant="surface"
							size="sm"
							disabled={page <= 1 || isFetching}
							onClick={() => setPage((current) => Math.max(1, current - 1))}
							aria-label={t('uploadHistory.table.prev')}>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="text-sm text-gray-600">
							{t('uploadHistory.table.page')} {page} / {totalPages}
						</span>
						<Button
							variant="surface"
							size="sm"
							disabled={page >= totalPages || isFetching}
							onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
							aria-label={t('uploadHistory.table.next')}>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</Card>
	);
}
