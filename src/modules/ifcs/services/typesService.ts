import { authHeader } from '@/shared/lib';
import type { CriticalityOption } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function getTypesByGroupCode(groupCode: string): Promise<CriticalityOption[]> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/types/by-group-code/${encodeURIComponent(groupCode)}`, {
		method: 'GET',
		headers: { accept: '*/*', ...authHeader() },
		credentials: 'include',
	});

	const body = (await res.json().catch(() => null)) as Envelope<CriticalityOption[]> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'types.error.byGroupFailed');
	return body.data.map((tp) => ({ ...tp, id: Number(tp.id) }));
}
