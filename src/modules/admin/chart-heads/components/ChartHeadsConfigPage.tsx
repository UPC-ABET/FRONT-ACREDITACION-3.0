'use client';

import { useState } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Card, LoadingDialog, SuccessDialog, Toast } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { useChartHeadsConfig, useSchoolOptions, useUserOptions } from '../hooks';
import { ChartHeadsForm } from './ChartHeadsForm';

export function ChartHeadsConfigPage() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const { data: config, isLoading, error } = useChartHeadsConfig(academicPeriodId);
	const schools = useSchoolOptions();
	const users = useUserOptions();

	return (
		<Card title={t('admin.chartHeads.page.title')}>
			<div className="space-y-6">
				{academicPeriodId === null && (
					<div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-white py-14 text-zinc-500">
						<CalendarDaysIcon className="h-10 w-10 text-zinc-400" />
						<p className="text-base italic">{t('admin.chartHeads.page.selectPeriod')}</p>
					</div>
				)}

				{academicPeriodId !== null && isLoading && (
					<LoadingDialog isOpen label={t('loading.default')} />
				)}

				{academicPeriodId !== null && config && (
					<ChartHeadsForm
						key={academicPeriodId}
						academicPeriodId={academicPeriodId}
						config={config}
						schoolOptions={schools.data ?? []}
						schoolsLoading={schools.isLoading}
						userOptions={users.data ?? []}
						usersLoading={users.isLoading}
						onSuccess={setSuccessMsg}
						onError={setErrorMsg}
					/>
				)}

				{(error || errorMsg) && (
					<Toast
						isOpen
						type="error"
						onClose={() => setErrorMsg(null)}
						message={tryTranslate(
							t,
							errorMsg ?? error?.message ?? 'admin.chartHeads.error.loadFailed',
						)}
					/>
				)}

				{successMsg && (
					<SuccessDialog isOpen onClose={() => setSuccessMsg(null)} message={successMsg} />
				)}
			</div>
		</Card>
	);
}
