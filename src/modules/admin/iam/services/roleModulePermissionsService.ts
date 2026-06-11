import { apiDelete, apiPost, getApiData, ApiError } from '@/shared/lib';
import type { RoleModulePermission } from '../types';

function normalizeLink(link: RoleModulePermission): RoleModulePermission {
	return {
		...link,
		id: Number(link.id),
		roleId: Number(link.roleId),
		moduleTypeId: Number(link.moduleTypeId),
		permissionTypeId: Number(link.permissionTypeId),
		isActive: Boolean(link.isActive),
	};
}

export async function getRoleModulePermissionsByFilters(filters: {
	roleId?: number;
	moduleTypeId?: number;
	permissionTypeId?: number;
}): Promise<RoleModulePermission[]> {
	const response = await apiPost('/admin-role-module-permissions/get-by-filters', filters);
	const links = getApiData<RoleModulePermission[]>(response);
	if (!Array.isArray(links)) throw new ApiError('admin.iam.roles.error.permissionsLoadFailed');
	return links.map(normalizeLink);
}

export async function assignRoleModulePermission(
	roleId: number,
	moduleTypeId: number,
	permissionTypeId: number,
): Promise<RoleModulePermission> {
	const response = await apiPost('/admin-role-module-permissions/create', {
		roleId: Number(roleId),
		moduleTypeId: Number(moduleTypeId),
		permissionTypeId: Number(permissionTypeId),
		isActive: true,
	});
	return normalizeLink(getApiData<RoleModulePermission>(response));
}

export async function unassignRoleModulePermission(id: number): Promise<void> {
	await apiDelete(`/admin-role-module-permissions/delete/${Number(id)}`);
}
