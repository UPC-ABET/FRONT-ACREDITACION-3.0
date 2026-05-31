'use client';

import { useQuery } from '@tanstack/react-query';
import {
	getParameterByCode,
	getTypesByGroupCode,
} from '@/modules/core';
import { PARAMETER_CODES, TYPE_GROUP_CODES } from '@/shared/constants';
import { listNotificationConfigs } from '../services/notificationConfigsService';
import type { CoreType, NotificationConfig, NotifyVar } from '../types';

interface ConfigsBundle {
	configs: NotificationConfig[];
	notifyVars: NotifyVar[];
	statuses: CoreType[];
	triggers: CoreType[];
	chartLevels: CoreType[];
}

const notificationConfigsKeys = {
	all: ['notification-configs'] as const,
	bundle: (periodId: number) => [...notificationConfigsKeys.all, 'bundle', periodId] as const,
};

async function fetchBundle(periodId: number): Promise<ConfigsBundle> {
	const [configs, notifyVarsValue, statuses, triggers, chartLevels] = await Promise.all([
		listNotificationConfigs(periodId),
		getParameterByCode<NotifyVar[]>(PARAMETER_CODES.IFC_NOTIFICATION_VARS),
		getTypesByGroupCode(TYPE_GROUP_CODES.IFC_STATUS) as Promise<CoreType[]>,
		getTypesByGroupCode(TYPE_GROUP_CODES.NOTIFICATION_TRIGGER) as Promise<CoreType[]>,
		getTypesByGroupCode(TYPE_GROUP_CODES.ORG_CHART_LEVEL) as Promise<CoreType[]>,
	]);
	return {
		configs,
		notifyVars: notifyVarsValue ?? [],
		statuses,
		triggers,
		chartLevels,
	};
}

export function useNotificationConfigs(periodId: number | null) {
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: notificationConfigsKeys.bundle(periodId!),
		queryFn: () => fetchBundle(periodId!),
		enabled: periodId != null,
	});

	return {
		data: data ?? null,
		loading: isLoading,
		error: error instanceof Error ? error.message : error ? String(error) : null,
		refetch,
	};
}
