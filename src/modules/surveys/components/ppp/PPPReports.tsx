'use client';

import React from 'react';
import { useI18n, useABET } from '@/providers';
import { PerceptionReportPanel } from '../shared/PerceptionReportPanel';
import { generatePPPPerceptionPdf } from '../../services';

interface PPPReportsProps {
	readonly programId: number;
}

export function PPPReports({ programId }: PPPReportsProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-base font-bold text-zinc-800">{t('surveys.ppp.reports.title')}</h3>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.ppp.reports.description')}</p>
			</div>

			<PerceptionReportPanel
				programId={programId || undefined}
				showSurveyNumber
				generate={generatePPPPerceptionPdf}
			/>
		</div>
	);
}
