import { apiDelete, apiGet, apiPost, apiPut, getApiData, ApiError } from '@/shared/lib';
import type { IamUser, UserCreateBody, UserFilters, UserUpdateBody } from '../types';

function normalizeUser(user: IamUser): IamUser {
	return {
		...user,
		id: Number(user.id),
		documentTypeId: user.documentTypeId == null ? null : Number(user.documentTypeId),
		isActive: Boolean(user.isActive),
	};
}

export async function listUsers(): Promise<IamUser[]> {
	const response = await apiGet('/users/get-all');
	const users = getApiData<IamUser[]>(response);
	if (!Array.isArray(users)) throw new ApiError('admin.iam.users.error.listFailed');
	return users.map(normalizeUser);
}

export async function getUsersByFilters(filters: UserFilters): Promise<IamUser[]> {
	const response = await apiPost('/users/get-by-filters', filters);
	const users = getApiData<IamUser[]>(response);
	if (!Array.isArray(users)) throw new ApiError('admin.iam.users.error.listFailed');
	return users.map(normalizeUser);
}

export async function createUser(body: UserCreateBody): Promise<IamUser> {
	const response = await apiPost('/users/create', body);
	return normalizeUser(getApiData<IamUser>(response));
}

export async function updateUser(id: number, body: UserUpdateBody): Promise<IamUser> {
	const response = await apiPut(`/users/update/${Number(id)}`, body);
	return normalizeUser(getApiData<IamUser>(response));
}

export async function deleteUser(id: number): Promise<void> {
	await apiDelete(`/users/delete/${Number(id)}`);
}
