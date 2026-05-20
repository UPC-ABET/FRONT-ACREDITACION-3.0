'use client';

import { useState } from 'react';
import { Card, ErrorDialog, LoadingDialog, SuccessDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import { AcademicPeriodSelect } from '@/modules/ifcs/components/AcademicPeriodSelect';
import { useNotificationConfigs } from '../hooks/useNotificationConfigs';
import { ConfigTabs } from './ConfigTabs';

function tryTranslate(t: (k: string) => string, key: string) {
	const translated = t(key);
	return translated === key ? key : translated;
}

export function NotificationConfigPage() {
	const { t } = useI18n();
	const [periodId, setPeriodId] = useState<number | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const { data, loading, error, refetch } = useNotificationConfigs(periodId);

	return (
		<Card title={t('admin.notify.page.title')}>
			<div className="space-y-6">
				<AcademicPeriodSelect value={periodId} onChange={setPeriodId} />

				{periodId !== null && loading && <LoadingDialog isOpen label={t('loading.default')} />}

				{periodId !== null && data && (
					<ConfigTabs
						periodId={periodId}
						triggers={data.triggers}
						statuses={data.statuses}
						chartLevels={data.chartLevels}
						notifyVars={data.notifyVars}
						configs={data.configs}
						onSaved={() => {
							void refetch();
						}}
						onError={setErrorMsg}
						onSuccess={setSuccessMsg}
					/>
				)}

				{(error || errorMsg) && (
					<ErrorDialog
						isOpen
						onClose={() => setErrorMsg(null)}
						message={tryTranslate(t, errorMsg ?? error ?? 'admin.notify.error.listFailed')}
					/>
				)}

				{successMsg && (
					<SuccessDialog
						isOpen
						onClose={() => setSuccessMsg(null)}
						message={successMsg}
					/>
				)}
			</div>
		</Card>
	);
}
