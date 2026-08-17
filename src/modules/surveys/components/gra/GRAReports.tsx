'use client';

import React, { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button, Select, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { getErrorMessage } from '@/shared/lib';
import {
	PerceptionReportPanel,
	type PerceptionReportPanelHandle,
} from '../shared/PerceptionReportPanel';
import { SurveyMetricsSummary } from '../shared/SurveyMetricsSummary';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';
import { CommissionCampusFilters } from '../shared/CommissionCampusFilters';
import { useSurveyFilterOptions } from '../../hooks';
import { downloadGRASurveys, generateGRAPerceptionPdf, generateGRADashboard } from '../../services';
import type { OptionItem } from '../../types';

export function GRAReports() {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const [programId, setProgramId] = useState(0);
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);
	// Defaults to the UI locale but stays user-overridable, so a coordinator browsing in
	// Spanish can still produce the English report an accreditor asked for. Only the value is
	// state — storing the whole option would freeze its label at the mount-time locale.
	const [lang, setLang] = useState<'es' | 'en'>(locale === 'en' ? 'en' : 'es');
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});
	const [downloading, setDownloading] = useState(false);
	const [generating, setGenerating] = useState(false);
	const panelRef = useRef<PerceptionReportPanelHandle>(null);

	const { commissionOptions, campusOptions } = useSurveyFilterOptions(programId);

	const languageOptions: OptionItem[] = [
		{ value: 'es', label: t('surveys.perception.spanish') },
		{ value: 'en', label: t('surveys.perception.english') },
	];

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
			await downloadGRASurveys(
				academicPeriodId,
				programId ?? 0,
				t('surveys.gra.reports.exportFileName'),
			);
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
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<AllProgramsSelect value={programId} onChange={setProgramId} wrapperClassName="" />
				<CommissionCampusFilters
					className="contents"
					namePrefix="gra-"
					commissionOptions={commissionOptions}
					campusOptions={campusOptions}
					commission={commission}
					campus={campus}
					onCommissionChange={setCommission}
					onCampusChange={setCampus}
				/>
				<Select
					name="gra-language"
					label={t('surveys.perception.language')}
					options={languageOptions}
					value={languageOptions.find((option) => option.value === lang) ?? languageOptions[0]}
					onChange={(_name, value) => {
						if (!value || Array.isArray(value)) return;
						setLang(value.value === 'en' ? 'en' : 'es');
					}}
				/>
			</div>

			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-base font-bold text-zinc-800">{t('surveys.gra.reports.title')}</h3>
					<p className="text-sm text-zinc-500 mt-1">{t('surveys.gra.reports.description')}</p>
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
						onClick={() => panelRef.current?.generate()}
						disabled={generating}
						loading={generating}>
						{t('surveys.perception.generate')}
					</Button>
				</div>
			</div>

			{dashboard && <SurveyMetricsSummary summary={dashboard.summary} />}

			<PerceptionReportPanel
				ref={panelRef}
				hideGenerateButton
				onGeneratingChange={setGenerating}
				programId={programId}
				allowUnfiltered
				generate={async (filters) => {
					dashboardMutation.mutate();
					return generateGRAPerceptionPdf(filters);
				}}
				externalFilters={{
					commissionId: commission ? Number(commission.value) : undefined,
					campusId: campus ? Number(campus.value) : undefined,
					lang,
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
