import { apiGet, apiPost, apiDelete, ApiError } from '@/shared/lib';
import type { NotificationConfig, UpsertConfigBody } from '../types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

function normalizeConfig(c: NotificationConfig): NotificationConfig {
	return {
		...c,
		id: Number(c.id),
		triggerTypeId: Number(c.triggerTypeId),
		ifcStatusTypeId: Number(c.ifcStatusTypeId),
		emailTemplateId: c.emailTemplateId == null ? null : Number(c.emailTemplateId),
		toChartEntityTypeIds: (c.toChartEntityTypeIds ?? []).map(Number),
		ccChartEntityTypeIds: (c.ccChartEntityTypeIds ?? []).map(Number),
	};
}

export async function listNotificationConfigs(): Promise<NotificationConfig[]> {
	const body = await apiGet<Envelope<NotificationConfig[]>>('/ifc-notification-configs/list');

	if (!body?.data) throw new ApiError(body?.message ?? 'admin.notify.error.listFailed');
	return body.data.map(normalizeConfig);
}

export async function upsertNotificationConfig(
	payload: UpsertConfigBody,
): Promise<NotificationConfig> {
	const body = await apiPost<Envelope<NotificationConfig>>(
		'/ifc-notification-configs/upsert',
		payload,
	);

	if (!body?.data) throw new ApiError(body?.message ?? 'admin.notify.error.saveFailed');
	return normalizeConfig(body.data);
}

export async function deleteNotificationConfig(id: number): Promise<void> {
	await apiDelete<Envelope<unknown>>(`/ifc-notification-configs/${Number(id)}`);
}
