import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { evaluationsService } from '../services'

export const evaluationsQueryKeys = {
  byEvaluator: (evaluatorId: string | number) => ['evaluations', 'by-evaluator', evaluatorId] as const,
}

export function useEvaluationsByEvaluator(evaluatorId: string | number | undefined) {
  return useQuery({
    queryKey: evaluationsQueryKeys.byEvaluator(evaluatorId!),
    queryFn: () => evaluationsService.getByEvaluator(evaluatorId!).then((r) => r.data),
    enabled: evaluatorId != null,
  })
}

export function useSubmitEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: evaluationsService.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] })
    },
  })
}
