'use client';

import { useCallback, useState } from 'react';
import { notifyIfc, notifyIfcAll } from '../services/ifcsNotifyService';
import type { NotifyAllResult, NotifyResult } from '../types';

export function useIfcNotify() {
	const [notifyingChartId, setNotifyingChartId] = useState<number | null>(null);
	const [notifyingAll, setNotifyingAll] = useState(false);

	const notifyOne = useCallback(async (chartId: number): Promise<NotifyResult> => {
		setNotifyingChartId(chartId);
		try {
			return await notifyIfc(chartId);
		} finally {
			setNotifyingChartId(null);
		}
	}, []);

	const notifyMany = useCallback(async (chartIds: number[]): Promise<NotifyAllResult> => {
		setNotifyingAll(true);
		try {
			return await notifyIfcAll(chartIds);
		} finally {
			setNotifyingAll(false);
		}
	}, []);

	return { notifyOne, notifyMany, notifyingChartId, notifyingAll };
}
