import type { FilterPortfolioProjectDto } from '../types';

export const portfolioQueryKeys = {
	all: ['portfolio'] as const,

	projects: () => [...portfolioQueryKeys.all, 'projects'] as const,
	projectsFiltered: (filters: FilterPortfolioProjectDto, page: number, pageSize: number) =>
		[...portfolioQueryKeys.projects(), 'filtered', filters, page, pageSize] as const,
	projectById: (id: number | string) =>
		[...portfolioQueryKeys.projects(), 'detail', id] as const,

	companies: (academicPeriodId: number, modalityTypeId: number) =>
		[...portfolioQueryKeys.all, 'companies', academicPeriodId, modalityTypeId] as const,

	researchLines: (params: { programId?: number; modalityTypeId?: number }) =>
		[...portfolioQueryKeys.all, 'research-lines', params] as const,

	applications: (projectId: number | string) =>
		[...portfolioQueryKeys.all, 'applications', projectId] as const,

	teachersByModality: (modalityTypeId: number) =>
		[...portfolioQueryKeys.all, 'teachers-by-modality', modalityTypeId] as const,
};
