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
import type { SemaphoreFilterDto, SemaphoreReportLang } from '../types';

export type SemaphoreFilterOption = {
	value: number;
	label: string;
};

type SelectedOption = { value: string | number } | null;

function toOptionValue(option: SelectedOption): number | null {
	return option ? Number(option.value) : null;
}

export function useSemaphoreReportFilters() {
	const { locale } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();

	const [accreditorId, setAccreditorId] = useState<number | null>(null);
	const [commissionId, setCommissionId] = useState<number | null>(null);
	const [programId, setProgramId] = useState<number | null>(null);
	const [outcomeId, setOutcomeId] = useState<number | null>(null);
	const [campusId, setCampusId] = useState<number | null>(null);
	const [lang, setLang] = useState<SemaphoreReportLang>(locale === 'en' ? 'en' : 'es');
	const [syncedPeriodId, setSyncedPeriodId] = useState(academicPeriodId);

	// The report is scoped to the active period (header). When it changes, the cascade
	// selections no longer apply, so reset them.
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
		queryKey: ['evaluation', 'semaphore-reports', 'campuses'],
		queryFn: () => campusesService.getAll().then((response) => response.data ?? []),
		staleTime: Infinity,
	});

	const outcomesQuery = useQuery({
		queryKey: ['evaluation', 'semaphore-reports', 'outcomes', programId, academicPeriodId],
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

	const accreditorOptions = useMemo<SemaphoreFilterOption[]>(
		() =>
			(accreditorsQuery.data ?? []).map((accreditor) => ({
				value: accreditor.id,
				label: `${accreditor.code} - ${localizedText(accreditor.name, locale)}`,
			})),
		[accreditorsQuery.data, locale],
	);

	const commissionOptions = useMemo<SemaphoreFilterOption[]>(
		() =>
			(commissionsQuery.data ?? []).map((commission) => ({
				value: commission.id,
				label: `${commission.code} - ${localizedText(commission.name, locale)}`,
			})),
		[commissionsQuery.data, locale],
	);

	const programOptions = useMemo<SemaphoreFilterOption[]>(
		() =>
			(programsQuery.data ?? []).map((program) => ({
				value: program.id,
				label: localizedText(program.name, locale) || program.code,
			})),
		[programsQuery.data, locale],
	);

	const outcomeOptions = useMemo<SemaphoreFilterOption[]>(
		() =>
			(outcomesQuery.data ?? []).map((outcome) => ({
				value: outcome.id,
				label: `${outcome.outcomeCode} - ${localizedText(outcome.outcomeName, locale)}`,
			})),
		[outcomesQuery.data, locale],
	);

	const campusOptions = useMemo<SemaphoreFilterOption[]>(
		() =>
			(campusesQuery.data ?? []).map((campus) => ({
				value: campus.id,
				label: localizedText(campus.name, locale) || campus.code,
			})),
		[campusesQuery.data, locale],
	);

	// The cascade resolves a single program-commission for the active period; the report API
	// only needs that id, not the accreditor/commission/program triple used to find it.
	const programCommissionId = useMemo<number | undefined>(() => {
		if (programId == null) return undefined;
		return detailedQuery.data?.[0]?.programCommissionId;
	}, [programId, detailedQuery.data]);

	const filters = useMemo<SemaphoreFilterDto>(
		() => ({
			programCommissionId,
			outcomeId: outcomeId ?? undefined,
			campusId: campusId ?? undefined,
			modalityTypeId: modalityTypeId ?? undefined,
			lang,
		}),
		[programCommissionId, outcomeId, campusId, modalityTypeId, lang],
	);

	const hasActiveFilters =
		accreditorId != null || campusId != null || lang !== (locale === 'en' ? 'en' : 'es');

	function reset() {
		setAccreditorId(null);
		setCommissionId(null);
		setProgramId(null);
		setOutcomeId(null);
		setCampusId(null);
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
		lang,
		accreditorOptions,
		commissionOptions,
		programOptions,
		outcomeOptions,
		campusOptions,
		isLoadingPrograms: programsQuery.isLoading,
		isLoadingOutcomes: outcomesQuery.isLoading,
		hasActiveFilters,
		onAccreditorChange: handleAccreditorChange,
		onCommissionChange: handleCommissionChange,
		onProgramChange: handleProgramChange,
		onOutcomeChange: (option: SelectedOption) => setOutcomeId(toOptionValue(option)),
		onCampusChange: (option: SelectedOption) => setCampusId(toOptionValue(option)),
		onLangChange: setLang,
		reset,
	};
}

export type SemaphoreReportFiltersState = ReturnType<typeof useSemaphoreReportFilters>;
