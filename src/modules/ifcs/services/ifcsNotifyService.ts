import { authHeader } from '@/shared/lib';
import type { NotifyAllResult, NotifyResult } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function notifyIfc(chartId: number, periodId: number): Promise<NotifyResult> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifcs/notify`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify({ chart_id: Number(chartId), period_id: Number(periodId) }),
	});

	const body = (await res.json().catch(() => null)) as Envelope<NotifyResult> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'ifcs.notify.error.generic');
	return body.data;
}

export async function notifyIfcAll(
	chartIds: number[],
	periodId: number,
): Promise<NotifyAllResult> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifcs/notify-all`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify({
			chart_ids: chartIds.map(Number),
			period_id: Number(periodId),
		}),
	});

	const body = (await res.json().catch(() => null)) as Envelope<NotifyAllResult> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'ifcs.notify.error.generic');
	return {
		sent: body.data.sent.map(Number),
		skipped: body.data.skipped.map(Number),
		errors: body.data.errors.map((e) => ({ chart_id: Number(e.chart_id), message: e.message })),
	};
}
