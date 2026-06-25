'use client';

import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { PerceptionReportPanel } from '../shared/PerceptionReportPanel';
import { downloadGRASurveys, generateGRAPerceptionPdf } from '../../services';

interface GRAReportsProps {
	readonly programId?: number;
}

export function GRAReports({ programId }: GRAReportsProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();

	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});
	const [downloading, setDownloading] = useState(false);

	async function handleDownload() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		setDownloading(true);
		try {
			await downloadGRASurveys(academicPeriodId, programId ?? 0);
		} catch (e) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (e as Error).message) });
		} finally {
			setDownloading(false);
		}
	}

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-base font-bold text-zinc-800">{t('surveys.gra.reports.title')}</h3>
					<p className="text-sm text-zinc-500 mt-1">{t('surveys.gra.reports.description')}</p>
				</div>
				<Button
					variant="surface"
					onClick={handleDownload}
					disabled={downloading}
					loading={downloading}>
					<ArrowDownTrayIcon className="h-4 w-4 mr-1" />
					{t('surveys.shared.downloadExcel')}
				</Button>
			</div>

			<PerceptionReportPanel programId={programId} generate={generateGRAPerceptionPdf} />

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
