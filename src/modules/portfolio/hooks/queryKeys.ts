export const portfolioQueryKeys = {
	// S3 file manager
	all: ['portfolio-s3'] as const,
	list: (prefix: string) => [...portfolioQueryKeys.all, 'list', prefix] as const,
	tree: (prefix: string) => [...portfolioQueryKeys.all, 'tree', prefix] as const,

	// Business-logic projects
	projects: () => ['portfolio', 'projects'] as const,
	projectsFiltered: (filters: object, page: number, pageSize: number) =>
		[...portfolioQueryKeys.projects(), 'filtered', filters, page, pageSize] as const,
	projectById: (id: number | string) =>
		[...portfolioQueryKeys.projects(), 'by-id', id] as const,
	applications: (projectId: number | string) =>
		[...portfolioQueryKeys.projects(), 'applications', projectId] as const,
	teachersByModality: (modalityTypeId: number) =>
		['portfolio', 'teachers', 'by-modality', modalityTypeId] as const,

	// Companies
	companies: (academicPeriodId: number, modalityTypeId: number) =>
		['portfolio', 'companies', academicPeriodId, modalityTypeId] as const,

	// Research lines
	researchLines: (params: object) => ['portfolio', 'research-lines', params] as const,
};
