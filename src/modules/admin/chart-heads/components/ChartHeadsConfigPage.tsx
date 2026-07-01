'use client';

import { useState } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { SuccessDialog, TableEmptyState, TableLoadingState, Toast } from '@/shared';
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
		<div className="space-y-6">
			{academicPeriodId === null && (
				<TableEmptyState
					icon={CalendarDaysIcon}
					message={t('admin.chartHeads.page.selectPeriod')}
				/>
			)}

			{academicPeriodId !== null && isLoading && <TableLoadingState label={t('loading.default')} />}

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
	);
}
