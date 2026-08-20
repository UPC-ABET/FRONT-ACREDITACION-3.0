'use client';

import { PageHeader, Tabs, useTabParam } from '@/shared';
import { useABET, useGlobalAcademicFiltersVisibilityOverride, useI18n } from '@/providers';
import {
	OutcomeConversionsTab,
	PerformanceReportFilters,
	PerformanceReportView,
} from '../components/performance-report';
import { usePerformanceReportFilters } from '../hooks/usePerformanceReportFilters';
import { PERFORMANCE_REPORT_KINDS } from '../constants/performanceReports';
import type { PerformanceReportKind } from '../types';

const CONVERSIONS_TAB = 'conversions';

export function PerformanceReports() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const filterState = usePerformanceReportFilters();
	const [activeTab, setActiveTab] = useTabParam(PERFORMANCE_REPORT_KINDS.RC);

	useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: true, period: true });

	const tabs = [
		{ id: PERFORMANCE_REPORT_KINDS.RC, label: t('performanceReports.tabs.rc') },
		{ id: PERFORMANCE_REPORT_KINDS.RV, label: t('performanceReports.tabs.rv') },
		{ id: CONVERSIONS_TAB, label: t('performanceReports.tabs.conversions') },
	];

	// An unknown ?tab= value falls back to the control report rather than rendering nothing.
	const reportKind: PerformanceReportKind =
		activeTab === PERFORMANCE_REPORT_KINDS.RV
			? PERFORMANCE_REPORT_KINDS.RV
			: PERFORMANCE_REPORT_KINDS.RC;

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('performanceReports.title')}
				description={t('performanceReports.subtitle')}
			/>

			<Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

			{activeTab === CONVERSIONS_TAB ? (
				<OutcomeConversionsTab academicPeriodId={academicPeriodId} />
			) : academicPeriodId == null ? (
				<p className="text-sm italic text-zinc-500">{t('performanceReports.selectPeriod')}</p>
			) : (
				<div className="space-y-6">
					<PerformanceReportFilters state={filterState} kind={reportKind} />
					<PerformanceReportView
						kind={reportKind}
						filters={filterState.appliedFilters}
						academicPeriodId={academicPeriodId}
					/>
				</div>
			)}
		</div>
	);
}
