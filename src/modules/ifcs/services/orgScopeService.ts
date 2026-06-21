import { apiPost, ApiError } from '@/shared/lib';
import { ApiResponse } from '@/shared';
import type { ScopeTree } from '../types';

export async function getOrgScope(): Promise<ScopeTree> {
	const envelope = await apiPost<ApiResponse<ScopeTree>>('/org-scope/get-scope');
	if (!envelope?.data) throw new ApiError('orgScope.error.generic');

	// pg may return bigint as string in some endpoints -- normalise to number.
	envelope.data.levels.forEach((lvl) => {
		lvl.options.forEach((opt) => {
			opt.id = Number(opt.id);
			opt.parentId = opt.parentId == null ? null : Number(opt.parentId);
		});
	});

	return envelope.data;
}
