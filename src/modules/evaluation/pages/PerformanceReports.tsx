'use client';

import { useState } from 'react';
import { PageHeader, Tabs } from '@/shared/components';
import { useABET, useGlobalAcademicFiltersVisibilityOverride, useI18n } from '@/providers';
import { PerformanceReportFilters, PerformanceReportView } from '../components/performance-report';
import { usePerformanceReportFilters } from '../hooks/usePerformanceReportFilters';
import { PERFORMANCE_REPORT_KINDS } from '../constants/performanceReports';
import type { PerformanceReportKind } from '../types';

export function PerformanceReports() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const filterState = usePerformanceReportFilters();
	const [activeTab, setActiveTab] = useState<PerformanceReportKind>(PERFORMANCE_REPORT_KINDS.RC);

	useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: true, period: true });

	const tabs = [
		{ id: PERFORMANCE_REPORT_KINDS.RC, label: t('performanceReports.tabs.rc') },
		{ id: PERFORMANCE_REPORT_KINDS.RV, label: t('performanceReports.tabs.rv') },
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('performanceReports.title')}
				description={t('performanceReports.subtitle')}
			/>

			<Tabs
				tabs={tabs}
				activeTab={activeTab}
				onChange={(id) => setActiveTab(id as PerformanceReportKind)}
			/>

			{academicPeriodId == null ? (
				<p className="text-sm italic text-zinc-500">{t('performanceReports.selectPeriod')}</p>
			) : (
				<div className="space-y-6">
					<PerformanceReportFilters state={filterState} kind={activeTab} />
					<PerformanceReportView
						kind={activeTab}
						filters={filterState.filters}
						academicPeriodId={academicPeriodId}
					/>
				</div>
			)}
		</div>
	);
}
