import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useABET, useI18n } from '@/providers';
import { localizedText } from '@/shared/utils';
import {
	campusesService,
	useAccreditors,
	useCommissionOptions,
	useProgramCommissionsDetailed,
	useProgramOptions,
} from '@/modules/academic';
import { outcomesService } from '@/modules/accreditation';
import { rubricsService } from '../services';
import type { PerformanceReportFilterDto, PerformanceReportLang } from '../types';

export type PerformanceReportFilterOption = {
	value: number;
	label: string;
};

type SelectedOption = { value: string | number } | null;

function toOptionValue(option: SelectedOption): number | null {
	return option ? Number(option.value) : null;
}

export function usePerformanceReportFilters() {
	const { locale } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();

	const [accreditorId, setAccreditorId] = useState<number | null>(null);
	const [commissionId, setCommissionId] = useState<number | null>(null);
	const [programId, setProgramId] = useState<number | null>(null);
	const [outcomeId, setOutcomeId] = useState<number | null>(null);
	const [campusId, setCampusId] = useState<number | null>(null);
	// RV only: rubrics whose grades feed the report. Empty = all rubrics.
	const [rubricIds, setRubricIds] = useState<number[]>([]);
	const [lang, setLang] = useState<PerformanceReportLang>(locale === 'en' ? 'en' : 'es');
	const [syncedPeriodId, setSyncedPeriodId] = useState(academicPeriodId);

	// The report is scoped to the active period (header). When it changes, the cascade
	// selections no longer apply, so reset them.
	if (academicPeriodId !== syncedPeriodId) {
		setSyncedPeriodId(academicPeriodId);
		setAccreditorId(null);
		setCommissionId(null);
		setProgramId(null);
		setOutcomeId(null);
		setRubricIds([]);
	}

	const accreditorsQuery = useAccreditors();
	const commissionsQuery = useCommissionOptions(accreditorId);
	const programsQuery = useProgramOptions(commissionId);
	const detailedQuery = useProgramCommissionsDetailed(
		{
			accreditorId: accreditorId ?? undefined,
			commissionId: commissionId ?? undefined,
			programId: programId ?? undefined,
		},
		academicPeriodId != null && programId != null,
	);

	const campusesQuery = useQuery({
		queryKey: ['evaluation', 'performance-reports', 'campuses'],
		queryFn: () => campusesService.getAll().then((response) => response.data ?? []),
		staleTime: Infinity,
	});

	const outcomesQuery = useQuery({
		queryKey: ['evaluation', 'performance-reports', 'outcomes', programId, academicPeriodId],
		queryFn: () =>
			outcomesService
				.maintenanceList({
					programId: programId!,
					academicPeriodId: academicPeriodId!,
					pageSize: 100,
				})
				.then((response) => response.data?.items ?? []),
		enabled: programId != null && academicPeriodId != null,
	});

	// RV-only rubric selector. Scoped to the chosen program and active period (the report
	// still ignores rubricIds for RC). Empty selection = all rubrics.
	const rubricsQuery = useQuery({
		queryKey: ['evaluation', 'performance-reports', 'rubrics', programId, academicPeriodId],
		queryFn: () =>
			rubricsService
				.getAll({ programId: programId! })
				.then((response) =>
					(response.data ?? []).filter(
						(rubric) =>
							rubric.studyPlanCourse?.studyPlanAcademicPeriod?.academicPeriodId ===
							academicPeriodId,
					),
				),
		enabled: programId != null && academicPeriodId != null,
	});

	const accreditorOptions = useMemo<PerformanceReportFilterOption[]>(
		() =>
			(accreditorsQuery.data ?? []).map((accreditor) => ({
				value: accreditor.id,
				label: `${accreditor.code} - ${localizedText(accreditor.name, locale)}`,
			})),
		[accreditorsQuery.data, locale],
	);

	const commissionOptions = useMemo<PerformanceReportFilterOption[]>(
		() =>
			(commissionsQuery.data ?? []).map((commission) => ({
				value: commission.id,
				label: `${commission.code} - ${localizedText(commission.name, locale)}`,
			})),
		[commissionsQuery.data, locale],
	);

	const programOptions = useMemo<PerformanceReportFilterOption[]>(
		() =>
			(programsQuery.data ?? []).map((program) => ({
				value: program.id,
				label: localizedText(program.name, locale) || program.code,
			})),
		[programsQuery.data, locale],
	);

	const outcomeOptions = useMemo<PerformanceReportFilterOption[]>(
		() =>
			(outcomesQuery.data ?? []).map((outcome) => ({
				value: outcome.id,
				label: `${outcome.outcomeCode} - ${localizedText(outcome.outcomeName, locale)}`,
			})),
		[outcomesQuery.data, locale],
	);

	const campusOptions = useMemo<PerformanceReportFilterOption[]>(
		() =>
			(campusesQuery.data ?? []).map((campus) => ({
				value: campus.id,
				label: localizedText(campus.name, locale) || campus.code,
			})),
		[campusesQuery.data, locale],
	);

	// Prefix each rubric with its course so the flat list reads grouped by course.
	const rubricOptions = useMemo<PerformanceReportFilterOption[]>(
		() =>
			(rubricsQuery.data ?? []).map((rubric) => {
				const course = rubric.studyPlanCourse?.course;
				const courseLabel = course ? `${course.code} - ${localizedText(course.name, locale)}` : '';
				const gradeType = localizedText(rubric.gradeType?.name, locale) || rubric.gradeType?.code;
				const label = [courseLabel, gradeType].filter(Boolean).join(' · ');
				return { value: rubric.id, label: label || `#${rubric.id}` };
			}),
		[rubricsQuery.data, locale],
	);

	// The cascade resolves a single program-commission for the active period; the report API
	// only needs that id, not the accreditor/commission/program triple used to find it.
	const programCommissionId = useMemo<number | undefined>(() => {
		if (programId == null) return undefined;
		return detailedQuery.data?.[0]?.programCommissionId;
	}, [programId, detailedQuery.data]);

	const filters = useMemo<PerformanceReportFilterDto>(
		() => ({
			programCommissionId,
			outcomeId: outcomeId ?? undefined,
			campusId: campusId ?? undefined,
			modalityTypeId: modalityTypeId ?? undefined,
			rubricIds: rubricIds.length > 0 ? rubricIds : undefined,
			lang,
		}),
		[programCommissionId, outcomeId, campusId, modalityTypeId, rubricIds, lang],
	);

	const hasActiveFilters =
		accreditorId != null ||
		campusId != null ||
		rubricIds.length > 0 ||
		lang !== (locale === 'en' ? 'en' : 'es');

	function reset() {
		setAccreditorId(null);
		setCommissionId(null);
		setProgramId(null);
		setOutcomeId(null);
		setCampusId(null);
		setRubricIds([]);
		setLang(locale === 'en' ? 'en' : 'es');
	}

	function handleAccreditorChange(option: SelectedOption) {
		setAccreditorId(toOptionValue(option));
		setCommissionId(null);
		setProgramId(null);
		setOutcomeId(null);
	}

	function handleCommissionChange(option: SelectedOption) {
		setCommissionId(toOptionValue(option));
		setProgramId(null);
		setOutcomeId(null);
	}

	function handleProgramChange(option: SelectedOption) {
		setProgramId(toOptionValue(option));
		setOutcomeId(null);
		setRubricIds([]);
	}

	return {
		filters,
		accreditorId,
		commissionId,
		programId,
		outcomeId,
		campusId,
		rubricIds,
		lang,
		accreditorOptions,
		commissionOptions,
		programOptions,
		outcomeOptions,
		campusOptions,
		rubricOptions,
		isLoadingPrograms: programsQuery.isLoading,
		isLoadingOutcomes: outcomesQuery.isLoading,
		isLoadingRubrics: rubricsQuery.isLoading,
		hasActiveFilters,
		onAccreditorChange: handleAccreditorChange,
		onCommissionChange: handleCommissionChange,
		onProgramChange: handleProgramChange,
		onOutcomeChange: (option: SelectedOption) => setOutcomeId(toOptionValue(option)),
		onCampusChange: (option: SelectedOption) => setCampusId(toOptionValue(option)),
		onRubricsChange: (ids: number[]) => setRubricIds(ids),
		onLangChange: setLang,
		reset,
	};
}

export type PerformanceReportFiltersState = ReturnType<typeof usePerformanceReportFilters>;
