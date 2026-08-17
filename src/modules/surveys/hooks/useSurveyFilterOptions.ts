import { useQuery } from '@tanstack/react-query';
import { campusesService } from '@/modules/academic';
import { useABET } from '@/providers';
import { listGRAOutcomes } from '../services';
import { surveyQueryKeys } from './useSurveyQueries';
import type { OptionItem } from '../types';

export function useSurveyFilterOptions(programId?: number) {
	const { academicPeriodId } = useABET();

	const { data: commissionOptions = [] } = useQuery({
		queryKey: surveyQueryKeys.commissions(programId, academicPeriodId),
		queryFn: () => listGRAOutcomes({ programId: programId as number }),
		enabled: Boolean(programId),
		select: (groups): OptionItem[] =>
			groups.map((group) => ({ value: group.commissionId, label: group.commissionName })),
	});

	const { data: campusOptions = [] } = useQuery({
		queryKey: surveyQueryKeys.campuses(),
		queryFn: () => campusesService.getAll().then((response) => response.data ?? []),
		staleTime: Infinity,
		select: (campuses): OptionItem[] =>
			campuses.map((item) => ({ value: item.id, label: item.name?.es ?? item.code })),
	});

	return { commissionOptions, campusOptions };
}
