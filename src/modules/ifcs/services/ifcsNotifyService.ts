import { apiPost } from '@/shared/lib';
import type { NotifyAllResult, NotifyResult } from './types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function notifyIfc(chartId: number, periodId: number): Promise<NotifyResult> {
	const envelope = await apiPost<Envelope<NotifyResult>>('/ifcs/notify', {
		chart_id: Number(chartId),
		period_id: Number(periodId),
	});
	if (!envelope?.data) throw new Error('ifcs.notify.error.generic');
	return envelope.data;
}

export async function notifyIfcAll(chartIds: number[], periodId: number): Promise<NotifyAllResult> {
	const envelope = await apiPost<Envelope<NotifyAllResult>>('/ifcs/notify-all', {
		chart_ids: chartIds.map(Number),
		period_id: Number(periodId),
	});
	if (!envelope?.data) throw new Error('ifcs.notify.error.generic');
	return {
		sent: envelope.data.sent.map(Number),
		skipped: envelope.data.skipped.map(Number),
		errors: envelope.data.errors.map((e) => ({ chart_id: Number(e.chart_id), message: e.message })),
	};
}
