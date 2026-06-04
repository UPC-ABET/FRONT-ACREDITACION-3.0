'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserRolesByFilters } from '../services';

export const userRolesKeys = {
	all: ['iam-user-roles'] as const,
	byUser: (userId: number) => [...userRolesKeys.all, 'user', userId] as const,
};

export function useUserRoles(userId: number | null) {
	return useQuery({
		queryKey: userRolesKeys.byUser(userId ?? 0),
		queryFn: () => getUserRolesByFilters({ userId: userId! }),
		enabled: userId != null,
		staleTime: 0,
	});
}
