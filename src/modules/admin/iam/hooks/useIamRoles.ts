'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	assignRoleModulePermission,
	createRole,
	deleteRole,
	listRoles,
	unassignRoleModulePermission,
	updateRole,
} from '../services';
import type {
	AdminRole,
	MatrixCell,
	RoleCreateBody,
	RoleModulePermission,
	RoleUpdateBody,
} from '../types';
import { roleModulePermissionsKeys } from './useRoleModulePermissions';

export const iamRolesKeys = {
	all: ['iam-roles'] as const,
	list: () => [...iamRolesKeys.all, 'list'] as const,
};

export function useRoles() {
	return useQuery({
		queryKey: iamRolesKeys.list(),
		queryFn: listRoles,
		placeholderData: (previousData) => previousData,
		staleTime: 0,
	});
}

function cellKey(moduleTypeId: number, permissionTypeId: number): string {
	return `${moduleTypeId}:${permissionTypeId}`;
}

async function syncRolePermissions(
	roleId: number,
	desiredCells: MatrixCell[],
	currentLinks: RoleModulePermission[],
): Promise<void> {
	const desired = new Set(
		desiredCells.map((cell) => cellKey(cell.moduleTypeId, cell.permissionTypeId)),
	);
	const current = new Set(
		currentLinks.map((link) => cellKey(link.moduleTypeId, link.permissionTypeId)),
	);
	const toAssign = desiredCells.filter(
		(cell) => !current.has(cellKey(cell.moduleTypeId, cell.permissionTypeId)),
	);
	const toUnassign = currentLinks.filter(
		(link) => !desired.has(cellKey(link.moduleTypeId, link.permissionTypeId)),
	);

	await Promise.all([
		...toAssign.map((cell) =>
			assignRoleModulePermission(roleId, cell.moduleTypeId, cell.permissionTypeId),
		),
		...toUnassign.map((link) => unassignRoleModulePermission(link.id)),
	]);
}

interface SaveRoleInput {
	id: number | null;
	body: RoleCreateBody | RoleUpdateBody;
	cells: MatrixCell[];
	currentPermissionLinks: RoleModulePermission[];
}

export function useSaveRole() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			body,
			cells,
			currentPermissionLinks,
		}: SaveRoleInput): Promise<AdminRole> => {
			const role = id
				? await updateRole(id, body as RoleUpdateBody)
				: await createRole(body as RoleCreateBody);
			await syncRolePermissions(role.id, cells, currentPermissionLinks);
			return role;
		},
		onSuccess: (role) => {
			queryClient.invalidateQueries({ queryKey: iamRolesKeys.all });
			queryClient.invalidateQueries({ queryKey: roleModulePermissionsKeys.byRole(role.id) });
		},
	});
}

export function useDeleteRole() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => deleteRole(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: iamRolesKeys.all }),
	});
}
