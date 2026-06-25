'use client';

import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { PerceptionReportPanel } from '../shared/PerceptionReportPanel';
import {
	downloadLCFCSurveys,
	downloadLCFCReportPdf,
	generateLCFCPerceptionPdf,
} from '../../services';

interface LCFCReportsProps {
	readonly programId: number;
}

export function LCFCReports({ programId }: LCFCReportsProps) {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();

	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});
	const [downloading, setDownloading] = useState(false);
	const [downloadingPdf, setDownloadingPdf] = useState(false);

	async function handleDownload() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		setDownloading(true);
		try {
			await downloadLCFCSurveys(programId || 0);
		} catch (e) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (e as Error).message) });
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
		} catch (e) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (e as Error).message) });
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

			<PerceptionReportPanel
				programId={programId || undefined}
				generate={generateLCFCPerceptionPdf}
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
