import { authHeader } from '@/shared/lib';
import type { IFCRow } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function listIFCs(chartIds: number[], periodId: number): Promise<IFCRow[]> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifcs/list`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify({
			chart_ids: chartIds.map(Number),
			period_id: Number(periodId),
		}),
	});

	const body = (await res.json().catch(() => null)) as Envelope<IFCRow[]> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'ifcs.error.generic');
	return body.data;
}
