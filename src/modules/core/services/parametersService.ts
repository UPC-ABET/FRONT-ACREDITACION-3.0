import { ApiResponse } from '@/shared';
import { apiPost } from '@/shared/lib/apiClient';
import { ApiError } from '@/shared/lib/apiError';
import type { ParameterRow } from '../types';

export async function getParameterByCode<T>(code: string): Promise<T> {
	const envelope = await apiPost<ApiResponse<Array<ParameterRow<T>>>>(
		'/parameters/get-by-filters',
		{
			code,
		},
	);
	if (!envelope?.data) throw new ApiError('parameters.error.notFound');

	const row = envelope.data[0];
	if (!row) throw new ApiError('parameters.error.notFound');
	return row.value;
}
