export const coreQueryKeys = {
	all: ['core'] as const,

	types: () => [...coreQueryKeys.all, 'types'] as const,
	typesByFilter: (filters: { typeGroupId?: number }) =>
		[...coreQueryKeys.types(), filters] as const,
	typesByGroupCode: (groupCode: string) =>
		[...coreQueryKeys.types(), 'by-group-code', groupCode] as const,

	typeGroups: () => [...coreQueryKeys.all, 'type-groups'] as const,
	typeGroupsByFilter: (filters: { code?: string }) =>
		[...coreQueryKeys.typeGroups(), filters] as const,

	parameters: () => [...coreQueryKeys.all, 'parameters'] as const,
	parameterByCode: (code: string) => [...coreQueryKeys.parameters(), code] as const,
};
