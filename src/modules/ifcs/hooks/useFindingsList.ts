'use client';

import { useCallback, useState } from 'react';
import { listFindings } from '../services/ifcFindingsService';
import type { FindingRow } from '../services/types';

export function useFindingsList() {
	const [rows, setRows] = useState<FindingRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastQuery, setLastQuery] = useState<{ chartIds: number[]; periodId: number } | null>(null);

	const load = useCallback(async (chartIds: number[], periodId: number): Promise<FindingRow[]> => {
		setLastQuery({ chartIds, periodId });
		if (chartIds.length === 0) {
			setRows([]);
			return [];
		}
		setLoading(true);
		setError(null);
		try {
			const data = await listFindings(chartIds, periodId);
			setRows(data);
			return data;
		} catch (e) {
			const message = e instanceof Error ? e.message : 'ifcFindings.error.listFailed';
			setError(message);
			setRows([]);
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	const refetch = useCallback(async (): Promise<FindingRow[]> => {
		if (!lastQuery) return [];
		return load(lastQuery.chartIds, lastQuery.periodId);
	}, [lastQuery, load]);

	return { rows, loading, error, load, setRows, refetch };
}
