export const portfolioQueryKeys = {
	// S3 file manager
	s3All: ['portfolio-s3'] as const,
	list: (prefix: string) => [...portfolioQueryKeys.s3All, 'list', prefix] as const,
	tree: (prefix: string) => [...portfolioQueryKeys.s3All, 'tree', prefix] as const,

	// Business-logic projects
	projects: () => ['portfolio', 'projects'] as const,
	projectsFiltered: (filters: object, page: number, pageSize: number) =>
		[...portfolioQueryKeys.projects(), 'filtered', filters, page, pageSize] as const,
	projectById: (id: number | string) => [...portfolioQueryKeys.projects(), 'by-id', id] as const,
	applications: (projectId: number | string) =>
		[...portfolioQueryKeys.projects(), 'applications', projectId] as const,
	teachersByModality: (modalityTypeId: number) =>
		['portfolio', 'teachers', 'by-modality', modalityTypeId] as const,

	// Companies
	companies: (academicPeriodId: number, modalityTypeId: number) =>
		['portfolio', 'companies', academicPeriodId, modalityTypeId] as const,

	// Research lines
	researchLinesAll: () => ['portfolio', 'research-lines'] as const,
	researchLines: (params: object) => [...portfolioQueryKeys.researchLinesAll(), params] as const,
};
