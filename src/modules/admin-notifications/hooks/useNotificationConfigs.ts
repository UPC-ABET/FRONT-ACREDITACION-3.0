'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/shared/lib/api-error';
import { getParameterByCode, getTypesByGroupCode } from '@/modules/ifcs/services';
import { listNotificationConfigs } from '../services/notificationConfigsService';
import type { CoreType, NotificationConfig, NotifyVar } from '../services/types';

interface ConfigsBundle {
	configs: NotificationConfig[];
	notifyVars: NotifyVar[];
	statuses: CoreType[];
	triggers: CoreType[];
	chartLevels: CoreType[];
}

export function useNotificationConfigs(periodId: number | null) {
	const [data, setData] = useState<ConfigsBundle | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		if (periodId == null) {
			setData(null);
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const [configs, notifyVarsValue, statuses, triggers, chartLevels] = await Promise.all([
				listNotificationConfigs(periodId),
				getParameterByCode<NotifyVar[]>('PARAMETER_IFC_NOTIFICATION_VARS'),
				getTypesByGroupCode('TG701') as Promise<CoreType[]>,
				getTypesByGroupCode('TG1002') as Promise<CoreType[]>,
				getTypesByGroupCode('TG902') as Promise<CoreType[]>,
			]);
			setData({
				configs,
				notifyVars: notifyVarsValue ?? [],
				statuses,
				triggers,
				chartLevels,
			});
		} catch (e) {
			setError(getErrorMessage(e, 'admin.notify.error.listFailed'));
		} finally {
			setLoading(false);
		}
	}, [periodId]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hook auto-loads on mount and periodId change
		void load();
	}, [load]);

	return { data, loading, error, refetch: load };
}
