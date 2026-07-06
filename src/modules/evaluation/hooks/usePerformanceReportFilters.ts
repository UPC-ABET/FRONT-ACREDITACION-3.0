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
	const [outcomeId, setOutcomeId] = useState<number | null>(null);
	const [campusId, setCampusId] = useState<number | null>(null);
	// RV only: grade types (core.types group TG205) whose grades feed the report. Empty = all.
	const [gradeTypeIds, setGradeTypeIds] = useState<number[]>([]);
	const [lang, setLang] = useState<PerformanceReportLang>(locale === 'en' ? 'en' : 'es');
	const [syncedPeriodId, setSyncedPeriodId] = useState(academicPeriodId);

	// The report is scoped to the active period (header). When it changes, the cascade
	// selections no longer apply, so reset them. This runs during render (React's documented
	// "adjust state on prop change" pattern), not in a useEffect: a useEffect would render once
	// with the stale filters before the reset commits, flashing outcomes/programs from the
	// previous period. Do not "fix" this into a useEffect.
	if (academicPeriodId !== syncedPeriodId) {
		setSyncedPeriodId(academicPeriodId);
		setAccreditorId(null);
		setCommissionId(null);
		setProgramId(null);
		setOutcomeId(null);
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

	// RV-only "grade type" selector (core.types group TG205, e.g. PA/TA/EA1). Unlike rubrics,
	// grade types are global catalog entries, so this list is period/program independent. The
	// report still ignores it for RC. Empty selection = all grade types.
	const gradeTypesQuery = useTypesByGroupCode(TYPE_GROUP_CODES.GRADE_TYPE);

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
			outcomeId: outcomeId ?? undefined,
			campusId: campusId ?? undefined,
			gradeTypeIds: gradeTypeIds.length > 0 ? gradeTypeIds : undefined,
			lang,
		}),
		[programCommissionId, outcomeId, campusId, gradeTypeIds, lang],
	);

	const hasActiveFilters =
		accreditorId != null ||
		campusId != null ||
		gradeTypeIds.length > 0 ||
		lang !== (locale === 'en' ? 'en' : 'es');

	function reset() {
		setAccreditorId(null);
		setCommissionId(null);
		setProgramId(null);
		setOutcomeId(null);
		setCampusId(null);
		setGradeTypeIds([]);
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
	}

	return {
		filters,
		accreditorId,
		commissionId,
		programId,
		outcomeId,
		campusId,
		gradeTypeIds,
		lang,
		accreditorOptions,
		commissionOptions,
		programOptions,
		outcomeOptions,
		campusOptions,
		gradeTypeOptions,
		isLoadingPrograms: programsQuery.isLoading,
		isLoadingOutcomes: outcomesQuery.isLoading,
		isLoadingGradeTypes: gradeTypesQuery.isLoading,
		hasActiveFilters,
		onAccreditorChange: handleAccreditorChange,
		onCommissionChange: handleCommissionChange,
		onProgramChange: handleProgramChange,
		onOutcomeChange: (option: SelectedOption) => setOutcomeId(toOptionValue(option)),
		onCampusChange: (option: SelectedOption) => setCampusId(toOptionValue(option)),
		onGradeTypesChange: (ids: number[]) => setGradeTypeIds(ids),
		onLangChange: setLang,
		reset,
	};
}

export type PerformanceReportFiltersState = ReturnType<typeof usePerformanceReportFilters>;
