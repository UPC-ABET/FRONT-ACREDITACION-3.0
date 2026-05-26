export const accreditationQueryKeys = {
	all: ['accreditation'] as const,
	outcomes: () => [...accreditationQueryKeys.all, 'outcomes'] as const,
	outcomeById: (id: number) => [...accreditationQueryKeys.outcomes(), 'by-id', id] as const,
};
