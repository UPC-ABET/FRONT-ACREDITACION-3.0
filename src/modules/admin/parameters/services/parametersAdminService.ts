import { apiPost, apiPut, ApiError } from '@/shared/lib';
import { ApiResponse } from '@/shared';
import type { ParameterRow, UpdateParameterBody } from '../types';

export async function getParameterByFilters<T>(code: string): Promise<ParameterRow<T>> {
	const body = await apiPost<ApiResponse<Array<ParameterRow<T>>>>('/parameters/get-by-filters', {
		code,
	});

	if (!body?.data) throw new ApiError(body?.message ?? 'admin.params.error.loadFailed');

	const row = body.data[0];
	if (!row) throw new ApiError('admin.params.error.notFound');
	return { ...row, id: Number(row.id) };
}

export async function updateParameter<T>(
	id: number,
	payload: UpdateParameterBody<T>,
): Promise<ParameterRow<T>> {
	const body = await apiPut<ApiResponse<ParameterRow<T>>>(
		`/parameters/update/${Number(id)}`,
		payload,
	);

	if (!body?.data) throw new ApiError(body?.message ?? 'admin.params.error.saveFailed');
	return { ...body.data, id: Number(body.data.id) };
}
