'use client';

import { useCallback, useEffect, useState } from 'react';
import { getParameterByFilters } from '../services/parametersAdminService';
import type { ParameterRow } from '../services/types';

export function useParameter<T>(code: string) {
	const [data, setData] = useState<ParameterRow<T> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const row = await getParameterByFilters<T>(code);
			setData(row);
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'admin.params.error.loadFailed';
			setError(msg);
		} finally {
			setLoading(false);
		}
	}, [code]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: auto-load
		void load();
	}, [load]);

	return { data, loading, error, refetch: load, setData };
}
