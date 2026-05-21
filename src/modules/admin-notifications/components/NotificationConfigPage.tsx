'use client';

import { useState } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
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
				<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:p-6">
					<div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						<AcademicPeriodSelect value={periodId} onChange={setPeriodId} />
					</div>
				</div>

				{periodId === null && (
					<div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-white py-14 text-zinc-500">
						<CalendarDaysIcon className="h-10 w-10 text-zinc-400" />
						<p className="text-base italic">
							{t('admin.notify.page.selectPeriod')}
						</p>
					</div>
				)}

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
