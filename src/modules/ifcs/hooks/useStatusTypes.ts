'use client';

import { useEffect, useState } from 'react';
import { getTypesByGroupCode } from '../services/typesService';
import type { CriticalityOption } from '../services/types';

export type StatusType = CriticalityOption;

export function useStatusTypes() {
	const [types, setTypes] = useState<StatusType[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		getTypesByGroupCode('TG701')
			.then((rows) => {
				if (alive) setTypes(rows);
			})
			.finally(() => {
				if (alive) setLoading(false);
			});
		return () => {
			alive = false;
		};
	}, []);

	return { types, loading };
}
