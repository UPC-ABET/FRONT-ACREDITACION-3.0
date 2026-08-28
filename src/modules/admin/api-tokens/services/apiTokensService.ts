import { apiDelete, apiGet, apiPost, apiPut, ApiError } from '@/shared/lib';
import { ApiResponse } from '@/shared';
import type {
	ApiToken,
	ApiTokenFilters,
	CreateApiTokenBody,
	IssuedApiToken,
	UpdateApiTokenBody,
} from '../types';

const BASE_ROUTE = '/admin-api-tokens';

export async function getApiTokens(): Promise<ApiToken[]> {
	const body = await apiGet<ApiResponse<ApiToken[]>>(`${BASE_ROUTE}/get-all`);

	if (!body?.data) {
		throw new ApiError(body?.message ?? 'admin.apiTokens.error.loadFailed');
	}
	return body.data;
}

export async function getApiTokensByFilters(filters: ApiTokenFilters): Promise<ApiToken[]> {
	const body = await apiPost<ApiResponse<ApiToken[]>>(`${BASE_ROUTE}/get-by-filters`, filters);

	if (!body?.data) {
		throw new ApiError(body?.message ?? 'admin.apiTokens.error.loadFailed');
	}
	return body.data;
}

export async function createApiToken(payload: CreateApiTokenBody): Promise<IssuedApiToken> {
	const body = await apiPost<ApiResponse<IssuedApiToken>>(`${BASE_ROUTE}/create`, payload);

	if (!body?.data) {
		throw new ApiError(body?.message ?? 'admin.apiTokens.error.createFailed');
	}
	return body.data;
}

export async function updateApiToken(id: number, payload: UpdateApiTokenBody): Promise<ApiToken> {
	const body = await apiPut<ApiResponse<ApiToken>>(`${BASE_ROUTE}/update/${id}`, payload);

	if (!body?.data) {
		throw new ApiError(body?.message ?? 'admin.apiTokens.error.updateFailed');
	}
	return body.data;
}

export async function revokeApiToken(id: number): Promise<ApiToken> {
	const body = await apiDelete<ApiResponse<ApiToken>>(`${BASE_ROUTE}/delete/${id}`);

	if (!body?.data) {
		throw new ApiError(body?.message ?? 'admin.apiTokens.error.revokeFailed');
	}
	return body.data;
}
