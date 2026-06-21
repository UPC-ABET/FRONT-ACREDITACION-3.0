import { apiPost, ApiError } from '@/shared/lib';
import { ApiResponse } from '@/shared';
import type { NotifyAllResult, NotifyResult } from '../types';

export async function notifyIfc(chartId: number): Promise<NotifyResult> {
	const envelope = await apiPost<ApiResponse<NotifyResult>>('/ifcs/notify', {
		chartId: Number(chartId),
	});
	if (!envelope?.data) throw new ApiError('ifcs.notify.error.generic');
	return envelope.data;
}

export async function notifyIfcAll(chartIds: number[]): Promise<NotifyAllResult> {
	const envelope = await apiPost<ApiResponse<NotifyAllResult>>('/ifcs/notify-all', {
		chartIds: chartIds.map(Number),
	});
	if (!envelope?.data) throw new ApiError('ifcs.notify.error.generic');
	return {
		sent: envelope.data.sent.map(Number),
		skipped: envelope.data.skipped.map(Number),
		errors: envelope.data.errors.map((e) => ({ chartId: Number(e.chartId), message: e.message })),
	};
}
