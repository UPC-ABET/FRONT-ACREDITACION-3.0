'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { Button, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { ApiError, getErrorMessage } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { useSemaphoreReport, useSemaphoreReportDownload } from '../../hooks/useSemaphoreReports';
import { SemaphoreKpiCards } from './SemaphoreKpiCards';
import { SemaphoreSummaryTable } from './SemaphoreSummaryTable';
import type { SemaphoreFilterDto, SemaphoreReportKind } from '../../types';

interface SemaphoreReportViewProps {
	readonly kind: SemaphoreReportKind;
	readonly filters: SemaphoreFilterDto;
	readonly academicPeriodId: number | null;
}

function isNotFound(error: unknown): boolean {
	return error instanceof ApiError && error.status === 404;
}

export function SemaphoreReportView({ kind, filters, academicPeriodId }: SemaphoreReportViewProps) {
	const { t } = useI18n();
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'error',
		msg: '',
	});

	const reportQuery = useSemaphoreReport(kind, filters, academicPeriodId);
	const downloadMutation = useSemaphoreReportDownload(kind);

	// The backend returns 404 when no rows match the filters; that is an empty state for the UI,
	// not a fatal error.
	const isEmpty = isNotFound(reportQuery.error);
	const report = reportQuery.data;
	const hasRows = (report?.summary.length ?? 0) > 0;

	const tableError =
		reportQuery.isError && !isEmpty
			? tryTranslate(t, getErrorMessage(reportQuery.error))
			: undefined;

	function handleDownload(format: 'pdf' | 'excel') {
		downloadMutation.mutate(
			{ format, filters },
			{
				onError: (error) => {
					const message = isNotFound(error)
						? t('semaphoreReports.empty')
						: tryTranslate(t, getErrorMessage(error));
					setToast({ open: true, type: 'error', msg: message });
				},
			},
		);
	}

	const isDownloadingPdf =
		downloadMutation.isPending && downloadMutation.variables?.format === 'pdf';
	const isDownloadingExcel =
		downloadMutation.isPending && downloadMutation.variables?.format === 'excel';

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				{report?.metadata && hasRows ? (
					<dl className="text-sm text-zinc-600">
						<div className="flex flex-wrap gap-x-6 gap-y-1">
							<div>
								<dt className="inline font-semibold text-zinc-700">
									{t('semaphoreReports.metadata.program')}:{' '}
								</dt>
								<dd className="inline">{report.metadata.programName}</dd>
							</div>
							<div>
								<dt className="inline font-semibold text-zinc-700">
									{t('semaphoreReports.metadata.commission')}:{' '}
								</dt>
								<dd className="inline">{report.metadata.commissionName}</dd>
							</div>
							<div>
								<dt className="inline font-semibold text-zinc-700">
									{t('semaphoreReports.metadata.accreditor')}:{' '}
								</dt>
								<dd className="inline">{report.metadata.accreditorCode}</dd>
							</div>
							<div>
								<dt className="inline font-semibold text-zinc-700">
									{t('semaphoreReports.metadata.period')}:{' '}
								</dt>
								<dd className="inline">{report.metadata.academicPeriodCode}</dd>
							</div>
						</div>
					</dl>
				) : (
					<div />
				)}

				<div className="flex shrink-0 gap-2">
					<Button
						variant="surface"
						size="sm"
						onClick={() => handleDownload('pdf')}
						disabled={!hasRows || downloadMutation.isPending}
						loading={isDownloadingPdf}>
						<ArrowDownTrayIcon className="mr-1 h-4 w-4" aria-hidden="true" />
						{t('semaphoreReports.downloadPdf')}
					</Button>
					<Button
						variant="surface"
						size="sm"
						onClick={() => handleDownload('excel')}
						disabled={!hasRows || downloadMutation.isPending}
						loading={isDownloadingExcel}>
						<DocumentArrowDownIcon className="mr-1 h-4 w-4" aria-hidden="true" />
						{t('semaphoreReports.downloadExcel')}
					</Button>
				</div>
			</div>

			{hasRows && (
				<SemaphoreKpiCards
					greenCount={report?.greenDetail.length ?? 0}
					yellowCount={report?.yellowDetail.length ?? 0}
					redCount={report?.redDetail.length ?? 0}
				/>
			)}

			<SemaphoreSummaryTable
				rows={isEmpty ? [] : (report?.summary ?? [])}
				isLoading={reportQuery.isLoading}
				errorMessage={tableError}
				emptyMessage={t('semaphoreReports.empty')}
			/>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
