import { authHeader } from '@/shared/lib';
import type { I18nText } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

interface ParameterRow<T> {
	id: number;
	code: string;
	value: T;
	name: I18nText;
	description: I18nText;
	is_active: boolean;
}

export async function getParameterByCode<T>(code: string): Promise<T> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/parameters/get-by-filters`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify({ code }),
	});

	const body = (await res.json().catch(() => null)) as Envelope<
		Array<ParameterRow<T>>
	> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'parameters.error.notFound');

	const row = body.data[0];
	if (!row) throw new Error('parameters.error.notFound');
	return row.value;
}
