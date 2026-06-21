'use client';

import { useQuery } from '@tanstack/react-query';
import { coreQueryKeys, getTypesByGroupCode } from '@/modules/core';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { getNotificationLogsByFilters } from '../services';
import type { CoreType, NotificationLogFilters } from '../types';

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

export function useNotificationStatuses() {
	return useQuery({
		queryKey: coreQueryKeys.typesByGroupCode(TYPE_GROUP_CODES.NOTIFICATION_STATUS),
		queryFn: () => getTypesByGroupCode(TYPE_GROUP_CODES.NOTIFICATION_STATUS) as Promise<CoreType[]>,
		staleTime: Infinity,
	});
}
