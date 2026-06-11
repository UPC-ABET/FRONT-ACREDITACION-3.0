import { ApiResponse } from '@/shared';
import { apiGet, apiPost } from '@/shared/lib';
import { ApiError } from '@/shared/lib/apiError';

export interface TypeOption {
	id: number;
	code: string;
	name: { es: string; en: string };
	description: Record<string, string>;
}

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function getTypesByGroupCode(groupCode: string): Promise<TypeOption[]> {
	const envelope = await apiGet<Envelope<TypeOption[]>>(
		`/types/by-group-code/${encodeURIComponent(groupCode)}`,
	);
	if (!envelope?.data) throw new ApiError('types.error.byGroupFailed');
	return envelope.data.map((tp) => ({ ...tp, id: Number(tp.id) }));
}

export const typesService = {
	getByFilters(filters: { typeGroupId?: number }): Promise<ApiResponse<TypeOption[]>> {
		return apiPost('/types/get-by-filters', filters);
	},

	getByGroupCode(groupCode: string): Promise<ApiResponse<TypeOption[]>> {
		return apiGet(`/types/by-group-code/${encodeURIComponent(groupCode)}`);
	},
};
