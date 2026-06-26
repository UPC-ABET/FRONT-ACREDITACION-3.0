'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { getErrorMessage } from '@/shared/lib';
import { PerceptionReportPanel } from '../shared/PerceptionReportPanel';
import { CommissionCampusFilters } from '../shared/CommissionCampusFilters';
import { SurveyMetricsSummary } from '../shared/SurveyMetricsSummary';
import { useSurveyFilterOptions } from '../../hooks';
import { downloadGRASurveys, generateGRAPerceptionPdf, generateGRADashboard } from '../../services';
import type { OptionItem } from '../../types';

interface GRAReportsProps {
	readonly programId?: number;
}

export function GRAReports({ programId }: GRAReportsProps) {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});
	const [downloading, setDownloading] = useState(false);

	const { commissionOptions, campusOptions } = useSurveyFilterOptions(programId);

	const dashboardMutation = useMutation({
		mutationFn: () =>
			generateGRADashboard({
				academicPeriodId: academicPeriodId ?? undefined,
				programId: programId || undefined,
				campusId: campus ? Number(campus.value) : undefined,
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
			await downloadGRASurveys(academicPeriodId, programId ?? 0);
		} catch (error) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (error as Error).message) });
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

			<CommissionCampusFilters
				commissionOptions={commissionOptions}
				campusOptions={campusOptions}
				commission={commission}
				campus={campus}
				onCommissionChange={setCommission}
				onCampusChange={setCampus}
			/>

			{dashboard && <SurveyMetricsSummary summary={dashboard.summary} />}

			<PerceptionReportPanel
				programId={programId}
				generate={async (filters) => {
					dashboardMutation.mutate();
					return generateGRAPerceptionPdf(filters);
				}}
				externalFilters={{
					commissionId: commission ? Number(commission.value) : undefined,
					campusId: campus ? Number(campus.value) : undefined,
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
