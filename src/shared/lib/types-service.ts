import { apiGet } from './api-client';
import { ApiError } from './api-error';

export interface TypeOption {
	id: number;
	code: string;
	name: Record<string, string>;
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
