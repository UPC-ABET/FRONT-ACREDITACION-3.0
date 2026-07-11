import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluationsService } from '../services';
import { projectsQueryKeys } from './useProjects';
import { evaluationQueryKeys } from './queryKeys';

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
