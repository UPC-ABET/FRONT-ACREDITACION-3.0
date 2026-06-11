import { apiDelete, apiGet, apiPost, apiPut, getApiData, ApiError } from '@/shared/lib';
import type { AdminRole, RoleCreateBody, RoleUpdateBody } from '../types';

function normalizeRole(role: AdminRole): AdminRole {
	return {
		...role,
		id: Number(role.id),
		isActive: Boolean(role.isActive),
		description: role.description ?? null,
	};
}

export async function listRoles(): Promise<AdminRole[]> {
	const response = await apiGet('/admin-roles/get-all');
	const roles = getApiData<AdminRole[]>(response);
	if (!Array.isArray(roles)) throw new ApiError('admin.iam.roles.error.listFailed');
	return roles.map(normalizeRole);
}

export async function createRole(body: RoleCreateBody): Promise<AdminRole> {
	const response = await apiPost('/admin-roles/create', body);
	return normalizeRole(getApiData<AdminRole>(response));
}

export async function updateRole(id: number, body: RoleUpdateBody): Promise<AdminRole> {
	const response = await apiPut(`/admin-roles/update/${Number(id)}`, body);
	return normalizeRole(getApiData<AdminRole>(response));
}

export async function deleteRole(id: number): Promise<void> {
	await apiDelete(`/admin-roles/delete/${Number(id)}`);
}
