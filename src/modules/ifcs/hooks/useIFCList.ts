'use client';

import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/shared/lib/apiError';
import { listIFCs } from '../services/ifcsService';
import type { IFCRow } from '../types';

export function useIFCList() {
	const [rows, setRows] = useState<IFCRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (chartIds: number[], periodId: number): Promise<IFCRow[]> => {
		if (chartIds.length === 0) {
			setRows([]);
			return [];
		}
		setLoading(true);
		setError(null);
		try {
			const data = await listIFCs(chartIds, periodId);
			setRows(data);
			return data;
		} catch (e) {
			setError(getErrorMessage(e, 'ifcs.error.generic'));
			setRows([]);
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	return { rows, loading, error, load, setRows };
}
