import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { evaluationsService } from '../services';
import { projectsQueryKeys } from './useProjects';
import { evaluationQueryKeys } from './query-keys';

export function useEvaluationsByEvaluator(evaluatorId: string | number | undefined) {
	return useQuery({
		queryKey: evaluationQueryKeys.evaluationsByEvaluator(evaluatorId!),
		queryFn: () => evaluationsService.getByEvaluator(evaluatorId!).then((r) => r.data),
		enabled: evaluatorId != null,
	});
}

export function useSubmitEvaluation(projectId?: string | number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: evaluationsService.submit,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: evaluationQueryKeys.evaluations() });
			if (projectId != null) {
				queryClient.invalidateQueries({ queryKey: projectsQueryKeys.details(projectId) });
			}
		},
	});
}
