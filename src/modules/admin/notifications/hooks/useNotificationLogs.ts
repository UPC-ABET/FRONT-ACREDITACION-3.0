'use client';

import { useQuery } from '@tanstack/react-query';
import { getNotificationLogsByFilters } from '../services';
import type { NotificationLogFilters } from '../types';

export const notificationLogsKeys = {
	all: ['notification-logs'] as const,
	filtered: (filters: NotificationLogFilters) =>
		[...notificationLogsKeys.all, 'filtered', filters] as const,
};

export function useNotificationLogs(filters: NotificationLogFilters) {
	return useQuery({
		queryKey: notificationLogsKeys.filtered(filters),
		queryFn: () => getNotificationLogsByFilters(filters),
		staleTime: 0,
	});
}
