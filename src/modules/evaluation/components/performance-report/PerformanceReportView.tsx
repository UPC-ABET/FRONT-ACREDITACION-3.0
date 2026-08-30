'use client';

import { useMemo, useState } from 'react';
import { ArrowDownTrayIcon, DocumentArrowDownIcon, UsersIcon } from '@heroicons/react/24/outline';
import { Button, Card, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { ApiError, getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { usePerformanceReport, usePerformanceReportDownload } from '@/modules';
import {
	PERFORMANCE_REPORT_KINDS,
	PerformanceReportChart,
	PerformanceLevelLegend,
	PerformanceReportTable,
	ProcessedRvGradesDialog,
} from '@/modules';
import type { PerformanceReportFilterDto, PerformanceReportKind } from '@/modules';

interface PerformanceReportViewProps {
	readonly kind: PerformanceReportKind;
	readonly filters: PerformanceReportFilterDto;
	readonly academicPeriodId: number | null;
	// Gates the report query: only fires once the user has clicked "Buscar" at least once for the
	// current period -- the initial/reset filters are a valid (empty) filter set, not an absent one.
	readonly enabled: boolean;
}

function isNotFound(error: unknown): boolean {
	return error instanceof ApiError && error.status === 404;
}

// The semaphore endpoints wrap every failure in a generic `message`
// (error.semaphoreReport.generateFailed) and put the actionable key in `data[0]` — reading
// only `message` would show "no se pudo generar el reporte" for every distinct cause.
function reportErrorKey(error: unknown): string {
	return getApiErrorReasons(error)[0] ?? getErrorMessage(error);
}

export function PerformanceReportView({
	kind,
	filters,
	academicPeriodId,
	enabled,
}: PerformanceReportViewProps) {
	const { t } = useI18n();
	const [toast, setToast] = useState<{
		open: boolean;
		type: 'success' | 'error' | 'warning';
		msg: string;
	}>({
		open: false,
		type: 'error',
		msg: '',
	});
	const [isGradesDialogOpen, setIsGradesDialogOpen] = useState(false);

	// gradeTypeIds only applies to RV and outcomeIds only to RC; strip the other one per kind so
	// the cache key doesn't churn on an input the backend ignores.
	const effectiveFilters = useMemo<PerformanceReportFilterDto>(
		() =>
			kind === PERFORMANCE_REPORT_KINDS.RV
				? { ...filters, outcomeIds: undefined }
				: { ...filters, gradeTypeIds: undefined },
		[kind, filters],
	);

	const isVerificationReport = kind === PERFORMANCE_REPORT_KINDS.RV;

	const reportQuery = usePerformanceReport(kind, effectiveFilters, academicPeriodId, enabled);
	const downloadMutation = usePerformanceReportDownload(kind);

	// The backend returns 404 when no rows match the filters; that is an empty state for the UI,
	// not a fatal error.
	const isEmpty = isNotFound(reportQuery.error);
	const report = reportQuery.data;
	const hasRows = (report?.summary.length ?? 0) > 0;

	const tableError =
		reportQuery.isError && !isEmpty
			? tryTranslate(t, reportErrorKey(reportQuery.error))
			: undefined;

	function handleDownload(format: 'pdf' | 'excel') {
		downloadMutation.mutate(
			{ format, filters: effectiveFilters },
			{
				onError: (error) => {
					if (isNotFound(error)) {
						setToast({ open: true, type: 'error', msg: t('performanceReports.empty') });
						return;
					}
					// A 503 means the query hit the backend's statement timeout: the fix is narrower
					// filters, not a bug report, so it reads as a warning rather than a failure.
					const isTimeout = error instanceof ApiError && error.status === 503;
					setToast({
						open: true,
						type: isTimeout ? 'warning' : 'error',
						msg: tryTranslate(t, reportErrorKey(error)),
					});
				},
			},
		);
	}

	const isDownloadingPdf =
		downloadMutation.isPending && downloadMutation.variables?.format === 'pdf';
	const isDownloadingExcel =
		downloadMutation.isPending && downloadMutation.variables?.format === 'excel';

	// Only show metadata fields that actually carry a value. program/commission/accreditor come
	// back empty when no single program is in scope (e.g. no program filter selected).
	const metadataItems = [
		{ label: t('performanceReports.metadata.program'), value: report?.metadata?.programName },
		{ label: t('performanceReports.metadata.commission'), value: report?.metadata?.commissionName },
		{ label: t('performanceReports.metadata.accreditor'), value: report?.metadata?.accreditorCode },
		{ label: t('performanceReports.metadata.period'), value: report?.metadata?.academicPeriodCode },
	].filter((item) => item.value != null && item.value !== '');

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				{report?.metadata && hasRows ? (
					<dl className="text-sm text-zinc-600">
						<div className="flex flex-wrap gap-x-6 gap-y-1">
							{metadataItems.map((item) => (
								<div key={item.label}>
									<dt className="inline font-semibold text-zinc-700">{item.label}: </dt>
									<dd className="inline">{item.value}</dd>
								</div>
							))}
						</div>
					</dl>
				) : (
					<div />
				)}

				<div className="flex shrink-0 gap-2">
					{isVerificationReport && (
						<Button
							variant="surface"
							size="sm"
							disabled={effectiveFilters.programCommissionId == null}
							onClick={() => setIsGradesDialogOpen(true)}>
							<UsersIcon className="mr-1 h-4 w-4" aria-hidden="true" />
							{t('processedRvGrades.openDialog')}
						</Button>
					)}
					<Button
						variant="surface"
						size="sm"
						onClick={() => handleDownload('pdf')}
						disabled={!hasRows || downloadMutation.isPending}
						loading={isDownloadingPdf}>
						<ArrowDownTrayIcon className="mr-1 h-4 w-4" aria-hidden="true" />
						{t('performanceReports.downloadPdf')}
					</Button>
					<Button
						variant="surface"
						size="sm"
						onClick={() => handleDownload('excel')}
						disabled={!hasRows || downloadMutation.isPending}
						loading={isDownloadingExcel}>
						<DocumentArrowDownIcon className="mr-1 h-4 w-4" aria-hidden="true" />
						{t('performanceReports.downloadExcel')}
					</Button>
				</div>
			</div>

			{hasRows && report && <PerformanceLevelLegend legend={report.legend} />}

			{hasRows && report && (
				<Card className="p-5">
					<PerformanceReportChart report={report} />
				</Card>
			)}

			<PerformanceReportTable
				rows={isEmpty ? [] : (report?.summary ?? [])}
				legend={report?.legend ?? []}
				isLoading={reportQuery.isLoading}
				errorMessage={tableError}
				emptyMessage={
					enabled ? t('performanceReports.empty') : t('performanceReports.promptSearch')
				}
			/>

			{isVerificationReport && (
				<ProcessedRvGradesDialog
					open={isGradesDialogOpen}
					onClose={() => setIsGradesDialogOpen(false)}
					programCommissionId={effectiveFilters.programCommissionId}
					academicPeriodId={academicPeriodId}
				/>
			)}

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
