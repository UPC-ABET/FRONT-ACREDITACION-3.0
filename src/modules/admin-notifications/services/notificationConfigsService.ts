import { apiGet, apiPost, apiDelete, ApiError } from '@/shared/lib';
import type { NotificationConfig, UpsertConfigBody } from './types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

function normalizeConfig(c: NotificationConfig): NotificationConfig {
	return {
		...c,
		id: Number(c.id),
		school_id: Number(c.school_id),
		academic_period_id: Number(c.academic_period_id),
		trigger_type_id: Number(c.trigger_type_id),
		ifc_status_type_id: Number(c.ifc_status_type_id),
		to_chart_level_type_ids: (c.to_chart_level_type_ids ?? []).map(Number),
		cc_chart_level_type_ids: (c.cc_chart_level_type_ids ?? []).map(Number),
	};
}

export async function listNotificationConfigs(periodId: number): Promise<NotificationConfig[]> {
	const body = await apiGet<Envelope<NotificationConfig[]>>(
		`/ifc-notification-configs/by-period?period_id=${Number(periodId)}`,
	);

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
