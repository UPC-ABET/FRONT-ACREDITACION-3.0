'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button, Card, Select, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { localizedText, tryTranslate } from '@/shared/utils';
import {
	PerceptionReportPanel,
	type PerceptionReportPanelHandle,
} from '../shared/PerceptionReportPanel';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';
import { SurveyMetricsSummary } from '../shared/SurveyMetricsSummary';
import { useSurveyFilterOptions } from '../../hooks';
import {
	downloadLCFCSurveys,
	downloadLCFCReportPdf,
	generateLCFCPerceptionPdf,
	generateLCFCDashboard,
	listLCFCOutcomes,
	generateLCFCOutcomeReportPdf,
} from '../../services';
import type { OptionItem } from '../../types';

const GROUP_VALUE = '__group__';
const ALL_VALUE = '__all__';

export function LCFCReports() {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	// ---- Card 1: Reporte de Resultados LCFC ----
	const [resultsProgramId, setResultsProgramId] = useState(0);
	const [downloadingReport, setDownloadingReport] = useState(false);
	const { courseOptions: resultsCourseChoices, availableSections: resultsSections } =
		useSurveyFilterOptions(resultsProgramId);

	const groupOption: OptionItem = {
		value: GROUP_VALUE,
		label: t('surveys.lcfc.reports.groupOption'),
	};
	const allOption: OptionItem = { value: ALL_VALUE, label: t('surveys.lcfc.reports.allOption') };
	const [resultsCourse, setResultsCourse] = useState<OptionItem>(allOption);
	const [resultsNrc, setResultsNrc] = useState<OptionItem>(allOption);

	const [prevResultsProgramId, setPrevResultsProgramId] = useState(resultsProgramId);
	if (resultsProgramId !== prevResultsProgramId) {
		setPrevResultsProgramId(resultsProgramId);
		setResultsCourse(allOption);
		setResultsNrc(allOption);
	}

	const [prevResultsCourseValue, setPrevResultsCourseValue] = useState(resultsCourse.value);
	if (resultsCourse.value !== prevResultsCourseValue) {
		setPrevResultsCourseValue(resultsCourse.value);
		setResultsNrc(allOption);
	}

	const resultsNrcOptions: OptionItem[] = useMemo(() => {
		if (resultsCourse.value === GROUP_VALUE) return [];
		if (resultsCourse.value === ALL_VALUE) return [groupOption, allOption];
		return [
			groupOption,
			allOption,
			...resultsSections
				.filter((section) => section.courseId === Number(resultsCourse.value))
				.map((section) => ({ value: section.courseSectionId, label: section.sectionCode })),
		];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [resultsSections, resultsCourse, locale]);

	const resultsCourseOptions: OptionItem[] = [groupOption, allOption, ...resultsCourseChoices];
	const hideCourseBreakdown = resultsCourse.value === GROUP_VALUE;
	const resultsCourseId =
		resultsCourse.value === GROUP_VALUE || resultsCourse.value === ALL_VALUE
			? undefined
			: Number(resultsCourse.value);
	const resultsNrcId =
		resultsNrc.value === GROUP_VALUE || resultsNrc.value === ALL_VALUE
			? undefined
			: Number(resultsNrc.value);
	const resultsGroupBy: 'course' | 'section' =
		resultsNrc.value === GROUP_VALUE ? 'course' : 'section';

	const { data: dashboard } = useQuery({
		queryKey: [
			'surveys',
			'lcfc',
			'dashboard',
			academicPeriodId,
			resultsProgramId,
			resultsCourseId,
			resultsNrcId,
		],
		queryFn: () =>
			generateLCFCDashboard({
				academicPeriodId: academicPeriodId ?? undefined,
				programId: resultsProgramId || undefined,
				courseId: resultsCourseId,
				courseSectionId: resultsNrcId,
			}),
		enabled: Boolean(academicPeriodId),
	});

	async function handleDownloadReport() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		setDownloadingReport(true);
		try {
			await downloadLCFCReportPdf({
				programId: resultsProgramId || undefined,
				lang: locale === 'en' ? 'en' : 'es',
				groupBy: resultsGroupBy,
				courseId: resultsCourseId,
				courseSectionId: resultsNrcId,
				hideCourseBreakdown,
			});
		} catch (error) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (error as Error).message) });
		} finally {
			setDownloadingReport(false);
		}
	}

	// ---- Card 2: Percepción por Curso ----
	const [perceptionProgramId, setPerceptionProgramId] = useState(0);
	const [downloading, setDownloading] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);
	const [course, setCourse] = useState<OptionItem | null>(null);
	const [nrc, setNrc] = useState<OptionItem | null>(null);
	const panelRef = useRef<PerceptionReportPanelHandle>(null);

	const { commissionOptions, campusOptions, courseOptions, availableSections } =
		useSurveyFilterOptions(perceptionProgramId);

	const [prevPerceptionProgramId, setPrevPerceptionProgramId] = useState(perceptionProgramId);
	if (perceptionProgramId !== prevPerceptionProgramId) {
		setPrevPerceptionProgramId(perceptionProgramId);
		setCourse(null);
		setNrc(null);
	}

	const [prevCourseValue, setPrevCourseValue] = useState(course?.value ?? null);
	if ((course?.value ?? null) !== prevCourseValue) {
		setPrevCourseValue(course?.value ?? null);
		setNrc(null);
	}

	const nrcOptions: OptionItem[] = useMemo(() => {
		if (!course) return [];
		return availableSections
			.filter((section) => section.courseId === Number(course.value))
			.map((section) => ({ value: section.courseSectionId, label: section.sectionCode }));
	}, [availableSections, course]);

	const commissionId = commission ? Number(commission.value) : undefined;
	const campusId = campus ? Number(campus.value) : undefined;
	const courseId = course ? Number(course.value) : undefined;
	const courseSectionId = nrc ? Number(nrc.value) : undefined;

	async function handleDownload() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		setDownloading(true);
		try {
			await downloadLCFCSurveys(perceptionProgramId || 0);
		} catch (error) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (error as Error).message) });
		} finally {
			setDownloading(false);
		}
	}

	// ---- Card 3: Percepción por Outcome ----
	const [outcomeProgramId, setOutcomeProgramId] = useState(0);
	const [outcomeCommission, setOutcomeCommission] = useState<OptionItem | null>(null);
	const [outcome, setOutcome] = useState<OptionItem | null>(null);
	const [generatingOutcomeReport, setGeneratingOutcomeReport] = useState(false);
	const [downloadingOutcomeExcel, setDownloadingOutcomeExcel] = useState(false);
	const outcomePanelRef = useRef<PerceptionReportPanelHandle>(null);

	const { commissionOptions: outcomeCommissionOptions } = useSurveyFilterOptions(outcomeProgramId);

	const [prevOutcomeProgramId, setPrevOutcomeProgramId] = useState(outcomeProgramId);
	if (outcomeProgramId !== prevOutcomeProgramId) {
		setPrevOutcomeProgramId(outcomeProgramId);
		setOutcomeCommission(null);
		setOutcome(null);
	}

	const [prevOutcomeCommissionValue, setPrevOutcomeCommissionValue] = useState(
		outcomeCommission?.value ?? null,
	);
	if ((outcomeCommission?.value ?? null) !== prevOutcomeCommissionValue) {
		setPrevOutcomeCommissionValue(outcomeCommission?.value ?? null);
		setOutcome(null);
	}

	const outcomeCommissionId = outcomeCommission ? Number(outcomeCommission.value) : undefined;

	const { data: outcomeOptions = [] } = useQuery({
		queryKey: ['surveys', 'lcfc', 'outcomes', outcomeProgramId, outcomeCommissionId],
		queryFn: () => listLCFCOutcomes(outcomeProgramId, outcomeCommissionId as number),
		enabled: Boolean(outcomeProgramId) && Boolean(outcomeCommissionId),
		select: (items): OptionItem[] =>
			items.map((item) => ({
				value: item.id,
				label: `${item.code} - ${typeof item.name === 'string' ? item.name : localizedText(item.name, locale)}`,
			})),
	});

	async function handleDownloadOutcomeExcel() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		setDownloadingOutcomeExcel(true);
		try {
			await downloadLCFCSurveys(outcomeProgramId || 0);
		} catch (error) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (error as Error).message) });
		} finally {
			setDownloadingOutcomeExcel(false);
		}
	}

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			<Card
				title={t('surveys.lcfc.reports.title')}
				description={t('surveys.lcfc.reports.resultsDescription')}>
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<AllProgramsSelect
							value={resultsProgramId}
							onChange={setResultsProgramId}
							wrapperClassName=""
						/>
						<Select
							name="lcfc-results-course"
							label={t('surveys.lcfc.reports.courseFilterLabel')}
							isSearchable
							isClearable={false}
							options={resultsCourseOptions}
							value={resultsCourse}
							onChange={(_name, value) =>
								value && !Array.isArray(value) && setResultsCourse(value as OptionItem)
							}
						/>
						<Select
							name="lcfc-results-nrc"
							label={t('surveys.lcfc.reports.nrcFilterLabel')}
							isSearchable
							isClearable={false}
							isDisabled={hideCourseBreakdown}
							options={resultsNrcOptions}
							value={resultsNrc}
							onChange={(_name, value) =>
								value && !Array.isArray(value) && setResultsNrc(value as OptionItem)
							}
						/>
					</div>

					<div className="flex justify-end">
						<Button
							variant="surface"
							onClick={handleDownloadReport}
							disabled={downloadingReport}
							loading={downloadingReport}>
							<DocumentTextIcon className="h-4 w-4 mr-1" />
							{t('surveys.lcfc.reports.downloadPdf')}
						</Button>
					</div>

					{dashboard && <SurveyMetricsSummary summary={dashboard.summary} />}
				</div>
			</Card>

			<Card
				title={t('surveys.lcfc.reports.averageTitle')}
				description={t('surveys.lcfc.reports.description')}>
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
						<AllProgramsSelect
							value={perceptionProgramId}
							onChange={setPerceptionProgramId}
							wrapperClassName=""
						/>
						<Select
							name="lcfc-commission"
							label={t('surveys.perception.commission')}
							placeholder={t('surveys.perception.allCommissions')}
							isClearable
							isSearchable
							options={commissionOptions}
							value={commission}
							onChange={(_name, value) =>
								setCommission(value && !Array.isArray(value) ? (value as OptionItem) : null)
							}
						/>
						<Select
							name="lcfc-campus"
							label={t('surveys.perception.campus')}
							placeholder={t('surveys.perception.allCampuses')}
							isClearable
							isSearchable
							options={campusOptions}
							value={campus}
							onChange={(_name, value) =>
								setCampus(value && !Array.isArray(value) ? (value as OptionItem) : null)
							}
						/>
						<Select
							name="lcfc-course"
							label={t('surveys.lcfc.reports.courseFilterLabel')}
							placeholder={t('surveys.lcfc.reports.courseFilterPlaceholder')}
							isClearable
							isSearchable
							options={courseOptions}
							value={course}
							onChange={(_name, value) =>
								setCourse(value && !Array.isArray(value) ? (value as OptionItem) : null)
							}
						/>
						<Select
							name="lcfc-nrc"
							label={t('surveys.lcfc.reports.nrcFilterLabel')}
							placeholder={t('surveys.lcfc.reports.nrcFilterPlaceholder')}
							isClearable
							isSearchable
							isDisabled={!course}
							options={nrcOptions}
							value={nrc}
							onChange={(_name, value) =>
								setNrc(value && !Array.isArray(value) ? (value as OptionItem) : null)
							}
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

					<PerceptionReportPanel
						ref={panelRef}
						hideGenerateButton
						requireCommission
						allowUnfiltered
						onGeneratingChange={setGenerating}
						programId={perceptionProgramId || undefined}
						generate={generateLCFCPerceptionPdf}
						externalFilters={{
							commissionId,
							campusId,
							courseId,
							courseSectionId,
							lang: locale === 'en' ? 'en' : 'es',
						}}
					/>
				</div>
			</Card>

			<Card
				title={t('surveys.lcfc.reports.byOutcomeTitle')}
				description={t('surveys.lcfc.reports.byOutcomeDescription')}>
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<AllProgramsSelect
							value={outcomeProgramId}
							onChange={setOutcomeProgramId}
							wrapperClassName=""
						/>
						<Select
							name="lcfc-outcome-commission"
							label={t('surveys.perception.commission')}
							placeholder={t('surveys.perception.allCommissions')}
							isClearable
							isSearchable
							options={outcomeCommissionOptions}
							value={outcomeCommission}
							onChange={(_name, value) =>
								setOutcomeCommission(value && !Array.isArray(value) ? (value as OptionItem) : null)
							}
						/>
						<Select
							name="lcfc-outcome"
							label={t('surveys.lcfc.reports.outcomeFilterLabel')}
							placeholder={t('surveys.lcfc.reports.outcomeFilterPlaceholder')}
							isClearable
							isSearchable
							isDisabled={!outcomeCommission}
							options={outcomeOptions}
							value={outcome}
							onChange={(_name, value) =>
								setOutcome(value && !Array.isArray(value) ? (value as OptionItem) : null)
							}
						/>
					</div>

					<div className="flex flex-wrap justify-end gap-2">
						<Button
							variant="surface"
							onClick={handleDownloadOutcomeExcel}
							disabled={downloadingOutcomeExcel}
							loading={downloadingOutcomeExcel}>
							<ArrowDownTrayIcon className="h-4 w-4 mr-1" />
							{t('surveys.shared.downloadExcel')}
						</Button>
						<Button
							onClick={() => outcomePanelRef.current?.generate()}
							disabled={generatingOutcomeReport}
							loading={generatingOutcomeReport}>
							{t('surveys.perception.generate')}
						</Button>
					</div>

					<PerceptionReportPanel
						ref={outcomePanelRef}
						hideGenerateButton
						requireCommission
						onGeneratingChange={setGeneratingOutcomeReport}
						programId={outcomeProgramId || undefined}
						generate={generateLCFCOutcomeReportPdf}
						externalFilters={{
							commissionId: outcomeCommissionId,
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
