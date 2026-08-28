import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { campusesService } from '@/modules/academic';
import { useABET } from '@/providers';
import { getAvailableSections, listGRAOutcomes } from '../services';
import { surveyQueryKeys } from './useSurveyQueries';
import type { AvailableSection, OptionItem } from '../types';

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

	// LCFC's course/NRC filters cascade from the career, so the underlying sections list is
	// scoped by programId the same way commissionOptions is.
	const { data: availableSections = [] } = useQuery<AvailableSection[]>({
		queryKey: surveyQueryKeys.lcfcAvailableSections(programId),
		queryFn: () => getAvailableSections(programId),
		enabled: Boolean(programId),
	});

	const courseOptions: OptionItem[] = useMemo(() => {
		const seen = new Map<number, string>();
		for (const section of availableSections) {
			if (!seen.has(section.courseId)) seen.set(section.courseId, section.courseName);
		}
		return Array.from(seen, ([value, label]) => ({ value, label }));
	}, [availableSections]);

	return { commissionOptions, campusOptions, courseOptions, availableSections };
}
