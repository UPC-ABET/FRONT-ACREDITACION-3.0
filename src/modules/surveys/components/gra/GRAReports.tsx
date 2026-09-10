'use client';

import React, { useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button, Card, Select, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { localizedText, tryTranslate } from '@/shared/utils';
import { getErrorMessage } from '@/shared/lib';
import {
	PerceptionReportPanel,
	type PerceptionReportPanelHandle,
} from '../shared/PerceptionReportPanel';
import { SurveyMetricsSummary } from '../shared/SurveyMetricsSummary';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';
import { CommissionCampusFilters } from '../shared/CommissionCampusFilters';
import { useSurveyFilterOptions } from '../../hooks';
import {
	downloadGRASurveys,
	generateGRAPerceptionPdf,
	generateGRADashboard,
	generateGRAImportancePdf,
	listGRAReportOutcomes,
} from '../../services';
import type { OptionItem } from '../../types';

export function GRAReports() {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	// ---- Card 1: Dashboard — Graduandos ----
	const [programId, setProgramId] = useState(0);
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);
	const [downloading, setDownloading] = useState(false);
	const [generating, setGenerating] = useState(false);
	const panelRef = useRef<PerceptionReportPanelHandle>(null);

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

	// ---- Card 2: Importancia por Outcome ----
	const [importanceProgramId, setImportanceProgramId] = useState(0);
	const [importanceCommission, setImportanceCommission] = useState<OptionItem | null>(null);
	const [outcome, setOutcome] = useState<OptionItem | null>(null);
	const [generatingImportance, setGeneratingImportance] = useState(false);
	const importancePanelRef = useRef<PerceptionReportPanelHandle>(null);

	const { commissionOptions: importanceCommissionOptions } =
		useSurveyFilterOptions(importanceProgramId);

	// A career change invalidates the commission it was scoped to, and a commission change the
	// outcome — same reset chain as LCFC's "Percepción por Outcome" card.
	const [prevImportanceProgramId, setPrevImportanceProgramId] = useState(importanceProgramId);
	if (importanceProgramId !== prevImportanceProgramId) {
		setPrevImportanceProgramId(importanceProgramId);
		setImportanceCommission(null);
		setOutcome(null);
	}

	const [prevImportanceCommissionValue, setPrevImportanceCommissionValue] = useState(
		importanceCommission?.value ?? null,
	);
	if ((importanceCommission?.value ?? null) !== prevImportanceCommissionValue) {
		setPrevImportanceCommissionValue(importanceCommission?.value ?? null);
		setOutcome(null);
	}

	const importanceCommissionId = importanceCommission
		? Number(importanceCommission.value)
		: undefined;

	const { data: outcomeOptions = [] } = useQuery({
		queryKey: ['surveys', 'gra', 'outcomes', importanceProgramId, importanceCommissionId],
		queryFn: () => listGRAReportOutcomes(importanceProgramId, importanceCommissionId as number),
		enabled: Boolean(importanceProgramId) && Boolean(importanceCommissionId),
		select: (items): OptionItem[] =>
			items.map((item) => ({
				value: item.id,
				label: `${item.code} - ${typeof item.name === 'string' ? item.name : localizedText(item.name, locale)}`,
			})),
	});

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			<Card
				title={t('surveys.gra.reports.title')}
				description={t('surveys.gra.reports.description')}>
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
					</div>

					<div className="flex flex-wrap justify-end gap-2">
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
							lang: locale === 'en' ? 'en' : 'es',
						}}
					/>
				</div>
			</Card>

			<Card
				title={t('surveys.gra.reports.importanceTitle')}
				description={t('surveys.gra.reports.importanceDescription')}>
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<AllProgramsSelect
							value={importanceProgramId}
							onChange={setImportanceProgramId}
							wrapperClassName=""
						/>
						<Select
							name="gra-importance-commission"
							label={t('surveys.perception.commission')}
							placeholder={t('surveys.perception.allCommissions')}
							isClearable
							isSearchable
							options={importanceCommissionOptions}
							value={importanceCommission}
							onChange={(_name, value) =>
								setImportanceCommission(
									value && !Array.isArray(value) ? (value as OptionItem) : null,
								)
							}
						/>
						<Select
							name="gra-importance-outcome"
							label={t('surveys.gra.reports.outcomeFilterLabel')}
							placeholder={t('surveys.gra.reports.outcomeFilterPlaceholder')}
							isClearable
							isSearchable
							isDisabled={!importanceCommission}
							options={outcomeOptions}
							value={outcome}
							onChange={(_name, value) =>
								setOutcome(value && !Array.isArray(value) ? (value as OptionItem) : null)
							}
						/>
					</div>

					<div className="flex justify-end">
						<Button
							onClick={() => importancePanelRef.current?.generate()}
							disabled={generatingImportance}
							loading={generatingImportance}>
							{t('surveys.perception.generate')}
						</Button>
					</div>

					<PerceptionReportPanel
						ref={importancePanelRef}
						hideGenerateButton
						requireCommission
						onGeneratingChange={setGeneratingImportance}
						programId={importanceProgramId || undefined}
						generate={generateGRAImportancePdf}
						externalFilters={{
							commissionId: importanceCommissionId,
							outcomeId: outcome ? Number(outcome.value) : undefined,
							lang: locale === 'en' ? 'en' : 'es',
						}}
					/>
				</div>
			</Card>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
