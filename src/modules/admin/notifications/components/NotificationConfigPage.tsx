'use client';

import { useState } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Card, LoadingDialog, SuccessDialog, Toast } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { useNotificationConfigs } from '../hooks/useNotificationConfigs';
import { NotificationConfigProvider } from '../hooks/useNotificationConfigContext';
import { ConfigTabs } from './ConfigTabs';

export function NotificationConfigPage() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const { data, loading, error, refetch } = useNotificationConfigs(academicPeriodId);

	return (
		<Card title={t('admin.notify.page.title')}>
			<div className="space-y-6">
				{academicPeriodId === null && (
					<div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-white py-14 text-zinc-500">
						<CalendarDaysIcon className="h-10 w-10 text-zinc-400" />
						<p className="text-base italic">{t('admin.notify.page.selectPeriod')}</p>
					</div>
				)}

				{academicPeriodId !== null && loading && (
					<LoadingDialog isOpen label={t('loading.default')} />
				)}

				{academicPeriodId !== null && data && (
					<NotificationConfigProvider
						periodId={academicPeriodId}
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
		</Card>
	);
}
