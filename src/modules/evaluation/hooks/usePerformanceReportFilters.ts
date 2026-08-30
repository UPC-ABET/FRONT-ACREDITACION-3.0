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
import { TYPE_GROUP_CODES } from '@/shared';
import { useTypesByGroupCode } from '@/modules/core/hooks';
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
	const { academicPeriodId } = useABET();

	const [accreditorId, setAccreditorId] = useState<number | null>(null);
	const [commissionId, setCommissionId] = useState<number | null>(null);
	const [programId, setProgramId] = useState<number | null>(null);
	// Downloads accept at most one campus (2+ -> 400 error.semaphoreReport.singleCampusRequired),
	// so the selector is single-valued and "no campus" means the consolidated report.
	const [campusId, setCampusId] = useState<number | null>(null);
	// RC only: RC is generated one outcome at a time, so its PDF download is always a zip -- one
	// PDF per selected outcome, or one per every active outcome of the commission when none are
	// selected. RV ignores this filter entirely.
	const [outcomeIds, setOutcomeIds] = useState<number[]>([]);
	// RV only: grade types (core.types group TG205) whose grades feed the report. Empty = all.
	const [gradeTypeIds, setGradeTypeIds] = useState<number[]>([]);
	const [lang, setLang] = useState<PerformanceReportLang>(locale === 'en' ? 'en' : 'es');
	const [syncedPeriodId, setSyncedPeriodId] = useState(academicPeriodId);
	// The report query only reads appliedFilters, not the live filters below — editing the
	// filter bar must not fire a request per keystroke/select change. It only advances on an
	// explicit search() (the "Buscar" button) or reset(), both single user actions.
	const [appliedFilters, setAppliedFilters] = useState<PerformanceReportFilterDto>({
		lang: locale === 'en' ? 'en' : 'es',
	});
	// Gates the report query itself: it must not fire just because appliedFilters exists (its
	// initial value is a real, valid filter set -- {lang} with everything else omitted, meaning
	// "no filter"). Only an explicit search() flips this to true; reset() and a period change
	// flip it back, so the view returns to its pre-search empty state instead of re-querying with
	// the now-reset filters.
	const [hasSearched, setHasSearched] = useState(false);

	// The report is scoped to the active period (header). When it changes, the cascade
	// selections no longer apply, so reset them. This runs during render (React's documented
	// "adjust state on prop change" pattern), not in a useEffect: a useEffect would render once
	// with the stale filters before the reset commits, flashing outcomes/programs from the
	// previous period. Do not "fix" this into a useEffect.
	// The rebuilt appliedFilters below reads campusIds/gradeTypeIds/lang off the *previous*
	// appliedFilters, not the live draft state: the live values may include filter edits the
	// user hasn't searched yet, and promoting those into appliedFilters here would fire a
	// query from an unsearched edit, bypassing the explicit "Buscar" gate.
	if (academicPeriodId !== syncedPeriodId) {
		setSyncedPeriodId(academicPeriodId);
		setAccreditorId(null);
		setCommissionId(null);
		setProgramId(null);
		setOutcomeIds([]);
		setHasSearched(false);
		setAppliedFilters({
			campusIds: appliedFilters.campusIds,
			gradeTypeIds: appliedFilters.gradeTypeIds,
			lang: appliedFilters.lang,
		});
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

	// RV-only "grade type" selector (core.types group TG205, e.g. PA/TA/EA1). Unlike rubrics,
	// grade types are global catalog entries, so this list is period/program independent. The
	// report still ignores it for RC. Empty selection = all grade types.
	const gradeTypesQuery = useTypesByGroupCode(TYPE_GROUP_CODES.GRADE_TYPE);

	// RC-only outcome selector, scoped to program + commission + period -- a program can have more
	// than one active commission in the same period, so commissionId is required here too, not
	// just programId, or outcomes from every commission would show up mixed together.
	const outcomesQuery = useQuery({
		queryKey: [
			'evaluation',
			'performance-reports',
			'outcomes',
			programId,
			commissionId,
			academicPeriodId,
		],
		queryFn: () =>
			outcomesService
				.maintenanceList({
					programId: programId!,
					commissionId: commissionId!,
					academicPeriodId: academicPeriodId!,
					pageSize: 100,
				})
				.then((response) => response.data?.items ?? []),
		enabled: programId != null && commissionId != null && academicPeriodId != null,
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
				label: outcome.outcomeCode,
			})),
		[outcomesQuery.data],
	);

	const campusOptions = useMemo<PerformanceReportFilterOption[]>(
		() =>
			(campusesQuery.data ?? []).map((campus) => ({
				value: campus.id,
				label: localizedText(campus.name, locale) || campus.code,
			})),
		[campusesQuery.data, locale],
	);

	// Grade types show their human-readable name (e.g. "PA"), never the id. The description is
	// appended when present so codes like "TB2" are easier to recognize.
	const gradeTypeOptions = useMemo<PerformanceReportFilterOption[]>(
		() =>
			(gradeTypesQuery.data ?? []).map((gradeType) => {
				const name = localizedText(gradeType.name, locale) || gradeType.code;
				const description = localizedText(gradeType.description, locale);
				const label = description ? `${name} — ${description}` : name;
				return { value: gradeType.id, label };
			}),
		[gradeTypesQuery.data, locale],
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
			campusIds: campusId != null ? [campusId] : undefined,
			outcomeIds: outcomeIds.length > 0 ? outcomeIds : undefined,
			gradeTypeIds: gradeTypeIds.length > 0 ? gradeTypeIds : undefined,
			lang,
		}),
		[programCommissionId, campusId, outcomeIds, gradeTypeIds, lang],
	);

	const hasActiveFilters =
		accreditorId != null ||
		campusId != null ||
		outcomeIds.length > 0 ||
		gradeTypeIds.length > 0 ||
		lang !== (locale === 'en' ? 'en' : 'es');

	const hasPendingChanges = useMemo(
		() => JSON.stringify(filters) !== JSON.stringify(appliedFilters),
		[filters, appliedFilters],
	);

	function search() {
		setAppliedFilters(filters);
		setHasSearched(true);
	}

	function reset() {
		setAccreditorId(null);
		setCommissionId(null);
		setProgramId(null);
		setCampusId(null);
		setOutcomeIds([]);
		setGradeTypeIds([]);
		setLang(locale === 'en' ? 'en' : 'es');
		setAppliedFilters({ lang: locale === 'en' ? 'en' : 'es' });
		setHasSearched(false);
	}

	function handleAccreditorChange(option: SelectedOption) {
		setAccreditorId(toOptionValue(option));
		setCommissionId(null);
		setProgramId(null);
		setOutcomeIds([]);
	}

	function handleCommissionChange(option: SelectedOption) {
		setCommissionId(toOptionValue(option));
		setProgramId(null);
		setOutcomeIds([]);
	}

	function handleProgramChange(option: SelectedOption) {
		setProgramId(toOptionValue(option));
		setOutcomeIds([]);
	}

	return {
		filters,
		appliedFilters,
		hasPendingChanges,
		hasSearched,
		search,
		accreditorId,
		commissionId,
		programId,
		campusId,
		outcomeIds,
		gradeTypeIds,
		lang,
		accreditorOptions,
		commissionOptions,
		programOptions,
		campusOptions,
		outcomeOptions,
		gradeTypeOptions,
		isLoadingPrograms: programsQuery.isLoading,
		isLoadingOutcomes: outcomesQuery.isLoading,
		isLoadingGradeTypes: gradeTypesQuery.isLoading,
		hasActiveFilters,
		onAccreditorChange: handleAccreditorChange,
		onCommissionChange: handleCommissionChange,
		onProgramChange: handleProgramChange,
		onCampusChange: (option: SelectedOption) => setCampusId(toOptionValue(option)),
		onOutcomesChange: (ids: number[]) => setOutcomeIds(ids),
		onGradeTypesChange: (ids: number[]) => setGradeTypeIds(ids),
		onLangChange: setLang,
		reset,
	};
}

export type PerformanceReportFiltersState = ReturnType<typeof usePerformanceReportFilters>;
