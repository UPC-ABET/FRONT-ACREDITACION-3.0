'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { getErrorMessage } from '@/shared/lib';
import { PerceptionReportPanel } from '../shared/PerceptionReportPanel';
import { SurveyMetricsSummary } from '../shared/SurveyMetricsSummary';
import {
	downloadLCFCSurveys,
	downloadLCFCReportPdf,
	generateLCFCPerceptionPdf,
	generateLCFCDashboard,
} from '../../services';

interface LCFCReportsProps {
	readonly programId: number;
	readonly commissionId?: number;
	readonly campusId?: number;
}

export function LCFCReports({ programId, commissionId, campusId }: LCFCReportsProps) {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});
	const [downloading, setDownloading] = useState(false);
	const [downloadingPdf, setDownloadingPdf] = useState(false);

	const dashboardMutation = useMutation({
		mutationFn: () =>
			generateLCFCDashboard({
				academicPeriodId: academicPeriodId ?? undefined,
				programId: programId || undefined,
				campusId,
			}),
		onError: (error) =>
			setToast({ open: true, type: 'error', msg: tryTranslate(t, getErrorMessage(error)) }),
	});
	const dashboard = dashboardMutation.data;

	async function handleDownload() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		setDownloading(true);
		try {
			await downloadLCFCSurveys(programId || 0);
		} catch (error) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (error as Error).message) });
		} finally {
			setDownloading(false);
		}
	}

	async function handleDownloadPdf() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		setDownloadingPdf(true);
		try {
			await downloadLCFCReportPdf(programId || 0, locale);
		} catch (error) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (error as Error).message) });
		} finally {
			setDownloadingPdf(false);
		}
	}

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-base font-bold text-zinc-800">{t('surveys.lcfc.reports.title')}</h3>
					<p className="text-sm text-zinc-500 mt-1">{t('surveys.lcfc.reports.description')}</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="surface"
						onClick={handleDownload}
						disabled={downloading}
						loading={downloading}>
						<ArrowDownTrayIcon className="h-4 w-4 mr-1" />
						{t('surveys.shared.downloadExcel')}
					</Button>
					<Button
						variant="surface"
						onClick={handleDownloadPdf}
						disabled={downloadingPdf}
						loading={downloadingPdf}>
						<ArrowDownTrayIcon className="h-4 w-4 mr-1" />
						{t('surveys.shared.downloadPdf')}
					</Button>
				</div>
			</div>

			{dashboard && <SurveyMetricsSummary summary={dashboard.summary} />}

			<PerceptionReportPanel
				programId={programId || undefined}
				generate={async (filters) => {
					dashboardMutation.mutate();
					return generateLCFCPerceptionPdf(filters);
				}}
				externalFilters={{
					commissionId: commissionId || undefined,
					campusId: campusId || undefined,
					lang: locale === 'en' ? 'en' : 'es',
				}}
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
