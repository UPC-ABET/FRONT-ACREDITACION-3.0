import { authHeader } from '@/shared/lib';
import type { ScopeTree } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function getOrgScope(periodId: number): Promise<ScopeTree> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/org-scope/get-scope`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		credentials: 'include',
		body: JSON.stringify({ period_id: periodId }),
	});

	const body = (await res.json().catch(() => null)) as Envelope<ScopeTree> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'orgScope.error.generic');

	// pg may return bigint as string in some endpoints — normalise to number.
	body.data.levels.forEach((lvl) => {
		lvl.options.forEach((opt) => {
			opt.id = Number(opt.id);
			opt.parent_id = opt.parent_id == null ? null : Number(opt.parent_id);
		});
	});

	return body.data;
}
