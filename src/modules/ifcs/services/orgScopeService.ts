import { apiPost, ApiError } from '@/shared/lib';
import type { ScopeTree } from './types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function getOrgScope(periodId: number): Promise<ScopeTree> {
	const envelope = await apiPost<Envelope<ScopeTree>>('/org-scope/get-scope', {
		period_id: periodId,
	});
	if (!envelope?.data) throw new ApiError('orgScope.error.generic');

	// pg may return bigint as string in some endpoints -- normalise to number.
	envelope.data.levels.forEach((lvl) => {
		lvl.options.forEach((opt) => {
			opt.id = Number(opt.id);
			opt.parent_id = opt.parent_id == null ? null : Number(opt.parent_id);
		});
	});

	return envelope.data;
}
