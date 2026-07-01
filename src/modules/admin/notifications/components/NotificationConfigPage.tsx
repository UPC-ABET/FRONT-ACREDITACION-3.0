'use client';

import { useState } from 'react';
import { SuccessDialog, TableLoadingState, Toast } from '@/shared';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { useNotificationConfigs } from '../hooks/useNotificationConfigs';
import { NotificationConfigProvider } from '../hooks/useNotificationConfigContext';
import { ConfigTabs } from './ConfigTabs';

export function NotificationConfigPage() {
	const { t } = useI18n();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const { data, loading, error, refetch } = useNotificationConfigs();

	return (
		<div className="space-y-6">
			{loading && <TableLoadingState label={t('loading.default')} />}

			{data && (
				<NotificationConfigProvider
					chartEntityTypes={data.chartEntityTypes}
					notifyVars={data.notifyVars}
					onSaved={() => {
						void refetch();
					}}
					onError={setErrorMsg}
					onSuccess={setSuccessMsg}>
					<ConfigTabs triggers={data.triggers} statuses={data.statuses} configs={data.configs} />
				</NotificationConfigProvider>
			)}

			{(error || errorMsg) && (
				<Toast
					isOpen
					type="error"
					onClose={() => setErrorMsg(null)}
					message={tryTranslate(t, errorMsg ?? error ?? 'admin.notify.error.listFailed')}
				/>
			)}

			{successMsg && (
				<SuccessDialog isOpen onClose={() => setSuccessMsg(null)} message={successMsg} />
			)}
		</div>
	);
}
