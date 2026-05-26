'use client';

import { useQuery } from '@tanstack/react-query';
import { getTypesByGroupCode } from '../services/typesService';
import type { CriticalityOption } from '../types';

export type StatusType = CriticalityOption;

export const statusTypesQueryKeys = {
	all: ['status-types'] as const,
	byGroup: (groupCode: string) => ['status-types', groupCode] as const,
};

export function useStatusTypes() {
	return useQuery({
		queryKey: statusTypesQueryKeys.byGroup('TG701'),
		queryFn: () => getTypesByGroupCode('TG701'),
	});
}
