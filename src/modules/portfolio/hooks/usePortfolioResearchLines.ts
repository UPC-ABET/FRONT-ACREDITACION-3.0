import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portfolioResearchLinesService } from '../services';
import type { CreatePortfolioResearchLineDto } from '../types';
import { portfolioQueryKeys } from './queryKeys';

export function usePortfolioResearchLines(params: {
	programId?: number;
	modalityTypeId?: number;
} = {}) {
	return useQuery({
		queryKey: portfolioQueryKeys.researchLines(params),
		queryFn: () => portfolioResearchLinesService.getAll(params),
		enabled: params.programId != null || params.modalityTypeId != null,
	});
}

export function useCreatePortfolioResearchLine() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreatePortfolioResearchLineDto) => portfolioResearchLinesService.create(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.all });
		},
	});
}
