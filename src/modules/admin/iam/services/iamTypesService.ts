import { apiDelete, apiGet, apiPost, apiPut, getApiData, ApiError } from '@/shared/lib';
import type {
	IamType,
	ModuleTypeCreateBody,
	PermissionTypeCreateBody,
	TypeUpdateBody,
} from '../types';

function normalizeType(type: IamType): IamType {
	return {
		...type,
		id: Number(type.id),
		typeGroupId: Number(type.typeGroupId),
		description: type.description ?? null,
		extra: type.extra ?? null,
	};
}

export async function listTypesByGroupCode(groupCode: string): Promise<IamType[]> {
	const response = await apiGet(`/types/by-group-code/${encodeURIComponent(groupCode)}`);
	const types = getApiData<IamType[]>(response);
	if (!Array.isArray(types)) throw new ApiError('admin.iam.types.error.listFailed');
	return types.map(normalizeType);
}

export async function createModuleType(body: ModuleTypeCreateBody): Promise<IamType> {
	const response = await apiPost('/types/create', body);
	return normalizeType(getApiData<IamType>(response));
}

export async function createPermissionType(body: PermissionTypeCreateBody): Promise<IamType> {
	const response = await apiPost('/types/create', body);
	return normalizeType(getApiData<IamType>(response));
}

export async function updateType(id: number, body: TypeUpdateBody): Promise<IamType> {
	const response = await apiPut(`/types/update/${Number(id)}`, body);
	return normalizeType(getApiData<IamType>(response));
}

export async function deleteType(id: number): Promise<void> {
	await apiDelete(`/types/delete/${Number(id)}`);
}
