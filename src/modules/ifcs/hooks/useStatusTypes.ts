'use client';

import { useQuery } from '@tanstack/react-query';
import { getTypesByGroupCode, TYPE_GROUP_CODES } from '@/modules/core';
import type { CriticalityOption } from '../types';

export type StatusType = CriticalityOption;

export const statusTypesQueryKeys = {
	all: ['status-types'] as const,
	byGroup: (groupCode: string) => ['status-types', groupCode] as const,
};

export function useStatusTypes() {
	return useQuery({
		queryKey: statusTypesQueryKeys.byGroup(TYPE_GROUP_CODES.IFC_STATUS),
		queryFn: () => getTypesByGroupCode(TYPE_GROUP_CODES.IFC_STATUS),
	});
}
