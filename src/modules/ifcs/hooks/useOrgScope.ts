'use client';

import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/shared/lib/api-error';
import { getOrgScope } from '../services/orgScopeService';
import type { ScopeTree } from '../services/types';

export function useOrgScope() {
	const [scope, setScope] = useState<ScopeTree | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (periodId: number): Promise<ScopeTree | null> => {
		setLoading(true);
		setError(null);
		try {
			const tree = await getOrgScope(periodId);
			setScope(tree);
			return tree;
		} catch (e) {
			setError(getErrorMessage(e, 'orgScope.error.generic'));
			setScope(null);
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	return { scope, loading, error, load, setScope };
}
