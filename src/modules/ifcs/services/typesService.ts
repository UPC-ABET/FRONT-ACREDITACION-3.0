import { apiGet } from '@/shared/lib';
import type { CriticalityOption } from './types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function getTypesByGroupCode(groupCode: string): Promise<CriticalityOption[]> {
	const envelope = await apiGet<Envelope<CriticalityOption[]>>(
		`/types/by-group-code/${encodeURIComponent(groupCode)}`,
	);
	if (!envelope?.data) throw new Error('types.error.byGroupFailed');
	return envelope.data.map((tp) => ({ ...tp, id: Number(tp.id) }));
}
