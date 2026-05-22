import { authHeader } from '@/shared/lib';
import type { FindingDetailPayload, FindingRow, PatchFindingBody } from './types';

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

export async function getFindingDetail(id: number): Promise<FindingDetailPayload> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifc-findings/get-by-id/${id}`, {
		method: 'GET',
		headers: { accept: '*/*', ...authHeader() },
	});

	const body = (await res.json().catch(() => null)) as Envelope<FindingDetailPayload> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'ifcFindings.error.viewFailed');

	const data = body.data;
	data.finding.id = Number(data.finding.id);
	data.actions.forEach((a) => {
		a.id = Number(a.id);
	});
	return data;
}

export async function patchFinding(
	id: number,
	payload: PatchFindingBody,
): Promise<{ id: number }> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifc-findings/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify(payload),
	});

	const body = (await res.json().catch(() => null)) as Envelope<{ id: number }> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'ifcFindings.error.patchFailed');

	return { id: Number(body.data.id) };
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
