'use client';

import { useCallback, useState } from 'react';
import { notifyIfc, notifyIfcAll } from '../services/ifcsNotifyService';
import type { NotifyAllResult, NotifyResult } from '../services/types';

export function useIfcNotify() {
	const [notifyingChartId, setNotifyingChartId] = useState<number | null>(null);
	const [notifyingAll, setNotifyingAll] = useState(false);

	const notifyOne = useCallback(
		async (chartId: number, periodId: number): Promise<NotifyResult> => {
			setNotifyingChartId(chartId);
			try {
				return await notifyIfc(chartId, periodId);
			} finally {
				setNotifyingChartId(null);
			}
		},
		[],
	);

	const notifyMany = useCallback(
		async (chartIds: number[], periodId: number): Promise<NotifyAllResult> => {
			setNotifyingAll(true);
			try {
				return await notifyIfcAll(chartIds, periodId);
			} finally {
				setNotifyingAll(false);
			}
		},
		[],
	);

	return { notifyOne, notifyMany, notifyingChartId, notifyingAll };
}
