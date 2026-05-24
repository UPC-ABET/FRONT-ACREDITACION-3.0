'use client';

import { useCallback, useEffect, useState } from 'react';
import { getIFCView } from '../services/ifcsService';
import type { IFCViewPayload } from '../services/types';

export function useIFCView(id: number) {
	const [data, setData] = useState<IFCViewPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const payload = await getIFCView(id);
			setData(payload);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'ifcs.error.viewFailed';
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
