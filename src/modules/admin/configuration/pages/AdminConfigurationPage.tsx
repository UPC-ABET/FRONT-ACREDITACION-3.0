'use client';

import { Card, PageHeader, Tabs, useTabParam } from '@/shared';
import { useGlobalAcademicFiltersVisibilityOverride, useI18n } from '@/providers';
import { ChartHeadsConfigPage } from '@/modules/admin/chart-heads';
import { PeriodsTab, ProgramCommissionsTab } from '../components';

const DEFAULT_TAB = 'periods';

export default function AdminConfigurationPage() {
	const { t } = useI18n();
	const [activeTab, setTab] = useTabParam(DEFAULT_TAB);

	useGlobalAcademicFiltersVisibilityOverride(
		activeTab === 'periods' ? { school: false, modality: false, period: false } : { school: false },
	);

	const topTabs = [
		{ id: 'periods', label: t('admin.configuration.tabs.periods') },
		{ id: 'program-commissions', label: t('admin.configuration.tabs.programCommissions') },
		{ id: 'chart-heads', label: t('admin.configuration.tabs.chartHeads') },
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('admin.configuration.page.title')}
				description={t('admin.configuration.page.subtitle')}
			/>

			<Tabs tabs={topTabs} activeTab={activeTab} onChange={setTab} />

			<Card className="overflow-visible">
				{activeTab === 'periods' && <PeriodsTab />}
				{activeTab === 'program-commissions' && <ProgramCommissionsTab />}
				{activeTab === 'chart-heads' && <ChartHeadsConfigPage />}
			</Card>
		</div>
	);
}
