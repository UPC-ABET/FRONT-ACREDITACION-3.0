'use client';

import { useState } from 'react';
import { PageHeader, Tabs } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { SemaphoreReportFilters, SemaphoreReportView } from '../components/semaphore-report';
import { useSemaphoreReportFilters } from '../hooks/useSemaphoreReportFilters';
import { SEMAPHORE_REPORT_KINDS } from '../constants/semaphore';
import type { SemaphoreReportKind } from '../types';

export function SemaphoreReports() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const filterState = useSemaphoreReportFilters();
	const [activeTab, setActiveTab] = useState<SemaphoreReportKind>(SEMAPHORE_REPORT_KINDS.RC);

	const tabs = [
		{ id: SEMAPHORE_REPORT_KINDS.RC, label: t('semaphoreReports.tabs.rc') },
		{ id: SEMAPHORE_REPORT_KINDS.RV, label: t('semaphoreReports.tabs.rv') },
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('semaphoreReports.title')}
				description={t('semaphoreReports.subtitle')}
			/>

			<Tabs
				tabs={tabs}
				activeTab={activeTab}
				onChange={(id) => setActiveTab(id as SemaphoreReportKind)}
			/>

			{academicPeriodId == null ? (
				<p className="text-sm italic text-zinc-500">{t('semaphoreReports.selectPeriod')}</p>
			) : (
				<div className="space-y-6">
					<SemaphoreReportFilters state={filterState} />
					<SemaphoreReportView
						kind={activeTab}
						filters={filterState.filters}
						academicPeriodId={academicPeriodId}
					/>
				</div>
			)}
		</div>
	);
}
