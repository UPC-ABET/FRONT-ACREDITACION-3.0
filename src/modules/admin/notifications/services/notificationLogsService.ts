import { apiGet, apiPost, getApiData, ApiError } from '@/shared/lib';
import type { NotificationLog, NotificationLogFilters } from '../types';

function normalizeLog(log: NotificationLog): NotificationLog {
	return {
		...log,
		id: Number(log.id),
		categoryTypeId: Number(log.categoryTypeId),
		emailTemplateId: log.emailTemplateId == null ? null : Number(log.emailTemplateId),
		notifierUserId: log.notifierUserId == null ? null : Number(log.notifierUserId),
		toEmails: log.toEmails ?? [],
		ccEmails: log.ccEmails ?? [],
		toStaffIds: (log.toStaffIds ?? []).map(Number),
		ccStaffIds: (log.ccStaffIds ?? []).map(Number),
	};
}

export async function listNotificationLogs(): Promise<NotificationLog[]> {
	const response = await apiGet('/notification-logs/get-all');
	const logs = getApiData<NotificationLog[]>(response);
	if (!Array.isArray(logs)) throw new ApiError('admin.notify.error.listFailed');
	return logs.map(normalizeLog);
}

export async function getNotificationLogsByFilters(
	filters: NotificationLogFilters,
): Promise<NotificationLog[]> {
	const response = await apiPost('/notification-logs/get-by-filters', filters);
	const logs = getApiData<NotificationLog[]>(response);
	if (!Array.isArray(logs)) throw new ApiError('admin.notify.error.listFailed');
	return logs.map(normalizeLog);
}
