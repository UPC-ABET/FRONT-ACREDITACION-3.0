import { authHeader } from '@/shared/lib';
import type {
	CreateIFCBody,
	IFCPrefill,
	IFCRow,
	IFCViewPayload,
	PatchIFCBody,
	RejectIFCBody,
} from './types';

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

export async function getIFCView(id: number): Promise<IFCViewPayload> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifcs/get-by-id/${id}`, {
		method: 'GET',
		headers: { accept: '*/*', ...authHeader() },
	});

	const body = (await res.json().catch(() => null)) as Envelope<IFCViewPayload> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'ifcs.error.viewFailed');

	body.data.ifc.id = Number(body.data.ifc.id);
	if (body.data.ifc.coordinator.user_id != null) {
		body.data.ifc.coordinator.user_id = Number(body.data.ifc.coordinator.user_id);
	}
	body.data.findings.forEach((f) => {
		f.id = Number(f.id);
		f.actions.forEach((a) => {
			a.id = Number(a.id);
		});
	});
	return body.data;
}

export async function submitIFC(id: number): Promise<void> {
	await postNoBody(`${BASE_URL}/ifcs/${id}/submit`, 'ifcs.error.submitFailed');
}

export async function approveIFC(id: number): Promise<void> {
	await postNoBody(`${BASE_URL}/ifcs/${id}/approve`, 'ifcs.error.approveFailed');
}

export async function rejectIFC(id: number, comment: RejectIFCBody['comment']): Promise<void> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifcs/${id}/reject`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify({ comment }),
	});

	const body = (await res.json().catch(() => null)) as Envelope<unknown> | null;
	if (!res.ok) throw new Error(body?.message ?? 'ifcs.error.rejectFailed');
}

export async function getIFCPrefill(chartId: number, periodId: number): Promise<IFCPrefill> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const url = `${BASE_URL}/ifcs/prefill?chart_id=${chartId}&period_id=${periodId}`;
	const res = await fetch(url, {
		method: 'GET',
		headers: { accept: '*/*', ...authHeader() },
	});

	const body = (await res.json().catch(() => null)) as Envelope<IFCPrefill> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'ifcs.error.prefillFailed');
	return body.data;
}

export async function createIFC(payload: CreateIFCBody): Promise<{ id: number }> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifcs/create`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify(payload),
	});

	const body = (await res.json().catch(() => null)) as Envelope<{ id: number }> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'ifcs.error.createFailed');
	return { id: Number(body.data.id) };
}

export async function patchIFC(id: number, payload: PatchIFCBody): Promise<{ id: number }> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifcs/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify(payload),
	});

	const body = (await res.json().catch(() => null)) as Envelope<{ id: number }> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'ifcs.error.patchFailed');
	return { id: Number(body.data.id) };
}

async function postNoBody(url: string, fallbackErrorKey: string): Promise<void> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(url, {
		method: 'POST',
		headers: { accept: '*/*', ...authHeader() },
	});

	const body = (await res.json().catch(() => null)) as Envelope<unknown> | null;
	if (!res.ok) throw new Error(body?.message ?? fallbackErrorKey);
}
