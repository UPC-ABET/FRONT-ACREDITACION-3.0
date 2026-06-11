import { apiDelete, apiPost, getApiData, ApiError } from '@/shared/lib';
import type { UserRole } from '../types';

function normalizeUserRole(link: UserRole): UserRole {
	return {
		...link,
		id: Number(link.id),
		userId: Number(link.userId),
		roleId: Number(link.roleId),
		isActive: Boolean(link.isActive),
	};
}

export async function getUserRolesByFilters(filters: {
	userId?: number;
	roleId?: number;
}): Promise<UserRole[]> {
	const response = await apiPost('/admin-user-roles/get-by-filters', filters);
	const links = getApiData<UserRole[]>(response);
	if (!Array.isArray(links)) throw new ApiError('admin.iam.users.error.rolesLoadFailed');
	return links.map(normalizeUserRole);
}

export async function assignUserRole(userId: number, roleId: number): Promise<UserRole> {
	const response = await apiPost('/admin-user-roles/create', {
		userId: Number(userId),
		roleId: Number(roleId),
		isActive: true,
	});
	return normalizeUserRole(getApiData<UserRole>(response));
}

export async function unassignUserRole(id: number): Promise<void> {
	await apiDelete(`/admin-user-roles/delete/${Number(id)}`);
}
