import { authHeader } from '@/shared/lib';
import type { FindingRow } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function listFindings(chartIds: number[], periodId: number): Promise<FindingRow[]> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifc-findings/list`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify({
			chart_ids: chartIds.map(Number),
			period_id: Number(periodId),
		}),
	});

	const body = (await res.json().catch(() => null)) as Envelope<FindingRow[]> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'ifcFindings.error.listFailed');

	return body.data.map((r) => ({
		...r,
		id: Number(r.id),
		ifc_id: Number(r.ifc_id),
		course_id: Number(r.course_id),
	}));
}

export async function deleteFinding(id: number): Promise<void> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifc-findings/${id}`, {
		method: 'DELETE',
		headers: { accept: '*/*', ...authHeader() },
	});

	const body = (await res.json().catch(() => null)) as Envelope<null> | null;
	if (!res.ok) throw new Error(body?.message ?? 'ifcFindings.error.deleteFailed');
}
