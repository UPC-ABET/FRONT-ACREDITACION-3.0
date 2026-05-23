'use client';

import { useCallback, useEffect, useState } from 'react';
import { getFindingDetail } from '../services/ifcFindingsService';
import type { FindingDetailPayload } from '../services/types';

export function useFindingDetail(id: number) {
	const [data, setData] = useState<FindingDetailPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const payload = await getFindingDetail(id);
			setData(payload);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'ifcFindings.error.viewFailed';
			setError(message);
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hook auto-loads on mount and id change
		void load();
	}, [load]);

	return { data, loading, error, refetch: load };
}
