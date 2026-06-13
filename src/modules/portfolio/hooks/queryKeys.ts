export const portfolioQueryKeys = {
	all: ['portfolio-s3'] as const,
	list: (prefix: string) => [...portfolioQueryKeys.all, 'list', prefix] as const,
};
