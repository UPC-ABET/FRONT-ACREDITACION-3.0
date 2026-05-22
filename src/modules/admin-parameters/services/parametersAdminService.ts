import { authHeader } from '@/shared/lib';
import type { ParameterRow, UpdateParameterBody } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function getParameterByFilters<T>(code: string): Promise<ParameterRow<T>> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/parameters/get-by-filters`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify({ code }),
	});

	const body = (await res.json().catch(() => null)) as Envelope<Array<ParameterRow<T>>> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'admin.params.error.loadFailed');

	const row = body.data[0];
	if (!row) throw new Error('admin.params.error.notFound');
	return { ...row, id: Number(row.id) };
}

export async function updateParameter<T>(
	id: number,
	payload: UpdateParameterBody<T>,
): Promise<ParameterRow<T>> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/parameters/update/${Number(id)}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify(payload),
	});

	const body = (await res.json().catch(() => null)) as Envelope<ParameterRow<T>> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'admin.params.error.saveFailed');
	return { ...body.data, id: Number(body.data.id) };
}
