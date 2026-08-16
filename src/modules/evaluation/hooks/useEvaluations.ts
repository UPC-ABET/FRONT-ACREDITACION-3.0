import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/shared/lib';
import { evaluationsService } from '../services';
import { projectsQueryKeys } from './useProjects';

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
		if (projectId == null) return;
		// A refetch problem must never surface as a failed save: the write already succeeded, and
		// the caller reads a rejection here as "the grades were not saved". A stale grid is
		// recoverable; a false error sends the evaluator to re-enter everything.
		try {
			await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detailsAll(projectId) });
		} catch (error: unknown) {
			logger.warn('Failed to refresh project evaluations after save', error);
		}
	}, [queryClient, projectId]);
}
