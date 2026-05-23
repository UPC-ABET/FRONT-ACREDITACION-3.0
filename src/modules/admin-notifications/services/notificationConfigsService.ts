import { authHeader } from '@/shared/lib';
import type { NotificationConfig, UpsertConfigBody } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

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
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const url = `${BASE_URL}/ifc-notification-configs/by-period?period_id=${Number(periodId)}`;
	const res = await fetch(url, {
		method: 'GET',
		headers: { accept: '*/*', ...authHeader() },
	});

	const body = (await res.json().catch(() => null)) as Envelope<NotificationConfig[]> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'admin.notify.error.listFailed');
	return body.data.map(normalizeConfig);
}

export async function upsertNotificationConfig(
	payload: UpsertConfigBody,
): Promise<NotificationConfig> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifc-notification-configs/upsert`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify(payload),
	});

	const body = (await res.json().catch(() => null)) as Envelope<NotificationConfig> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'admin.notify.error.saveFailed');
	return normalizeConfig(body.data);
}

export async function deleteNotificationConfig(id: number): Promise<void> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/ifc-notification-configs/${Number(id)}`, {
		method: 'DELETE',
		headers: { accept: '*/*', ...authHeader() },
	});

	if (!res.ok) {
		const body = (await res.json().catch(() => null)) as Envelope<unknown> | null;
		throw new Error(body?.message ?? 'admin.notify.error.deleteFailed');
	}
}
