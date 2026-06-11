'use client';

import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/shared/lib/apiError';
import { listFindings } from '../services/ifcFindingsService';
import type { FindingRow } from '../types';

export function useFindingsList() {
	const [rows, setRows] = useState<FindingRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastChartIds, setLastChartIds] = useState<number[] | null>(null);

	const load = useCallback(async (chartIds: number[]): Promise<FindingRow[]> => {
		setLastChartIds(chartIds);
		if (chartIds.length === 0) {
			setRows([]);
			return [];
		}
		setLoading(true);
		setError(null);
		try {
			const data = await listFindings(chartIds);
			setRows(data);
			return data;
		} catch (e) {
			setError(getErrorMessage(e, 'ifcFindings.error.listFailed'));
			setRows([]);
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	const refetch = useCallback(async (): Promise<FindingRow[]> => {
		if (!lastChartIds) return [];
		return load(lastChartIds);
	}, [lastChartIds, load]);

	return { rows, loading, error, load, setRows, refetch };
}
