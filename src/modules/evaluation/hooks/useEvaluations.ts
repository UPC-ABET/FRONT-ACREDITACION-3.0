import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluationsService } from '../services';
import { projectsQueryKeys } from './useProjects';
import { evaluationQueryKeys } from './queryKeys';

/**
 * A rubric is submitted as one request per student, so this mutation deliberately does NOT
 * invalidate on success: the first student to resolve would start a refetch that races the ones
 * still being written, and the project would come back half-graded. Callers batch the submits and
 * then call `useInvalidateProjectEvaluations` once, after all of them settle.
 */
export function useSubmitEvaluation() {
	return useMutation({ mutationFn: evaluationsService.submit });
}

export function useInvalidateProjectEvaluations(projectId?: string | number) {
	const queryClient = useQueryClient();

	return useCallback(async () => {
		// A refetch problem must never surface as a failed save: the write already succeeded, and
		// the caller reads a rejection here as "the grades were not saved". A stale grid is
		// recoverable; a false error sends the evaluator to re-enter everything.
		try {
			await queryClient.invalidateQueries({ queryKey: evaluationQueryKeys.evaluations() });
			if (projectId != null) {
				await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detailsAll(projectId) });
			}
		} catch {
			// The query keeps its own error state; the grid stays on the last good data.
		}
	}, [queryClient, projectId]);
}
