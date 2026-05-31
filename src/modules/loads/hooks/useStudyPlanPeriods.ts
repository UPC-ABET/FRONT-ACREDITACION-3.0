import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { associateStudyPlan, listStudyPlansByPeriod, unassociateStudyPlan } from '../services';
import { LOADS_QUERY_KEYS } from '../constants';
import type {
	AssociateStudyPlanPayload,
	AssociateStudyPlanResponse,
	StudyPlanPeriod,
} from '../types';

export function useStudyPlanPeriods(periodId: number | null) {
	return useQuery<StudyPlanPeriod[], Error>({
		queryKey: periodId
			? LOADS_QUERY_KEYS.studyPlansByPeriod(periodId)
			: ['loads', 'study-plans', 'noop'],
		queryFn: () => (periodId ? listStudyPlansByPeriod(periodId) : Promise.resolve([])),
		enabled: !!periodId,
	});
}

export function useAssociateStudyPlan(periodId: number | null) {
	const queryClient = useQueryClient();
	return useMutation<AssociateStudyPlanResponse, Error, AssociateStudyPlanPayload>({
		mutationFn: associateStudyPlan,
		onSuccess: () => {
			if (periodId) {
				queryClient.invalidateQueries({
					queryKey: LOADS_QUERY_KEYS.studyPlansByPeriod(periodId),
				});
			}
		},
	});
}

export function useUnassociateStudyPlan(periodId: number | null) {
	const queryClient = useQueryClient();
	return useMutation<
		{ success: boolean; deleted_courses: number },
		Error,
		AssociateStudyPlanPayload
	>({
		mutationFn: unassociateStudyPlan,
		onSuccess: () => {
			if (periodId) {
				queryClient.invalidateQueries({
					queryKey: LOADS_QUERY_KEYS.studyPlansByPeriod(periodId),
				});
			}
		},
	});
}
