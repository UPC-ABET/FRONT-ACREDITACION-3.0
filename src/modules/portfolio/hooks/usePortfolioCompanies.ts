import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portfolioCompaniesService } from '../services';
import type { CreatePortfolioCompanyDto } from '../types';
import { portfolioQueryKeys } from './queryKeys';

export function usePortfolioCompanies(
	academicPeriodId: number | undefined,
	modalityTypeId: number | undefined,
) {
	return useQuery({
		queryKey: portfolioQueryKeys.companies(academicPeriodId!, modalityTypeId!),
		queryFn: () => portfolioCompaniesService.getAll(academicPeriodId!, modalityTypeId!),
		enabled: academicPeriodId != null && modalityTypeId != null,
	});
}

export function useCreatePortfolioCompany() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreatePortfolioCompanyDto) => portfolioCompaniesService.create(dto),
		onSuccess: (_, dto) => {
			queryClient.invalidateQueries({
				queryKey: portfolioQueryKeys.companies(dto.academicPeriodId, dto.modalityTypeId),
			});
		},
	});
}
