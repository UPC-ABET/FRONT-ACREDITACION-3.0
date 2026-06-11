'use client';

import { useQuery } from '@tanstack/react-query';
import { getRoleModulePermissionsByFilters } from '../services';

export const roleModulePermissionsKeys = {
	all: ['iam-role-module-permissions'] as const,
	byRole: (roleId: number) => [...roleModulePermissionsKeys.all, 'role', roleId] as const,
};

export function useRoleModulePermissions(roleId: number | null) {
	return useQuery({
		queryKey: roleModulePermissionsKeys.byRole(roleId ?? 0),
		queryFn: () => getRoleModulePermissionsByFilters({ roleId: roleId! }),
		enabled: roleId != null,
		staleTime: 0,
	});
}
